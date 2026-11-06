import type { Availability, Movie, Provider, Region, SearchResult, Trailer } from '../../../shared/types';
import { tmdbGet } from './tmdb';
import {
  emptyAvailability,
  mapAvailability,
  mapDetails,
  mapListItem,
  mapProvider,
  pickTrailer,
  type TmdbMovieDetails,
  type TmdbMovieListItem,
  type TmdbPaged,
  type TmdbProvider,
  type TmdbVideo,
  type TmdbWatchProviders,
} from './tmdbMappers';

const HOUR = 60 * 60 * 1000;
export const AVAILABILITY_TTL_MS = 12 * HOUR;
const RESULT_LIMIT = 6;
const REGIONS: Region[] = ['CA', 'US', 'GB'];

// ---------- Availability cache (localStorage, per movie + region) ----------

const cacheKey = (id: number, region: Region) => `reel-avail:${region}:${id}`;

interface Cached {
  at: number;
  value: Availability;
}

function readCache(id: number, region: Region, maxAgeMs: number): Availability | null {
  try {
    const raw = localStorage.getItem(cacheKey(id, region));
    if (!raw) return null;
    const c = JSON.parse(raw) as Cached;
    return Date.now() - c.at <= maxAgeMs ? c.value : null;
  } catch {
    return null;
  }
}

/** The watch/providers response covers every country — store all regions we support. */
function storeAllRegions(id: number, raw: TmdbWatchProviders) {
  const at = Date.now();
  for (const region of REGIONS) {
    try {
      const entry: Cached = { at, value: mapAvailability(region, raw.results?.[region]) };
      localStorage.setItem(cacheKey(id, region), JSON.stringify(entry));
    } catch {
      /* storage full or unavailable — fine, we just refetch next time */
    }
  }
}

/** Cached availability for one movie in one region (fetched from TMDB when stale). */
export async function availability(id: number, region: Region): Promise<Availability> {
  const fresh = readCache(id, region, AVAILABILITY_TTL_MS);
  if (fresh) return fresh;
  try {
    const raw = await tmdbGet<TmdbWatchProviders>(`/movie/${id}/watch/providers`);
    storeAllRegions(id, raw);
    return mapAvailability(region, raw.results?.[region]);
  } catch (err) {
    // Fall back to stale data rather than showing nothing.
    const stale = readCache(id, region, Infinity);
    if (stale) return stale;
    throw err;
  }
}

/** Run `fn` over `items` with at most `limit` in flight (keeps TMDB happy on big lists). */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

// ---------- Genres ----------

let genreMap: Promise<Map<number, string>> | undefined;

function genres(): Promise<Map<number, string>> {
  genreMap ??= tmdbGet<{ genres: { id: number; name: string }[] }>('/genre/movie/list', { language: 'en-US' }, 24 * HOUR)
    .then((r) => new Map(r.genres.map((g) => [g.id, g.name])))
    .catch((err) => {
      genreMap = undefined;
      throw err;
    });
  return genreMap;
}

async function withAvailability(items: TmdbMovieListItem[], region: Region): Promise<SearchResult[]> {
  const names = await genres();
  return Promise.all(
    items.slice(0, RESULT_LIMIT).map(async (item) => ({
      ...mapListItem(item, names),
      availability: await availability(item.id, region).catch(() => emptyAvailability(region)),
    })),
  );
}

// ---------- Public catalog API ----------

export async function search(query: string, region: Region, signal?: AbortSignal): Promise<SearchResult[]> {
  const page = await tmdbGet<TmdbPaged<TmdbMovieListItem>>(
    '/search/movie',
    { query, include_adult: false, language: 'en-US', page: 1 },
    10 * 60 * 1000,
    signal,
  );
  return withAvailability(page.results, region);
}

export async function trending(region: Region, signal?: AbortSignal): Promise<SearchResult[]> {
  const page = await tmdbGet<TmdbPaged<TmdbMovieListItem>>('/trending/movie/week', { language: 'en-US' }, HOUR, signal);
  return withAvailability(page.results, region);
}

/** Full details (runtime, genre names) plus availability; refreshes the availability cache. */
export async function details(id: number, region: Region): Promise<{ movie: Movie; availability: Availability }> {
  const d = await tmdbGet<TmdbMovieDetails>(`/movie/${id}`, { language: 'en-US', append_to_response: 'watch/providers' });
  const providers = d['watch/providers'];
  if (providers) storeAllRegions(id, providers);
  return { movie: mapDetails(d), availability: mapAvailability(region, providers?.results?.[region]) };
}

/** Streaming services available in a region, most popular first. */
export async function providers(region: Region): Promise<Provider[]> {
  const r = await tmdbGet<{ results: (TmdbProvider & { display_priorities?: Record<string, number> })[] }>(
    '/watch/providers/movie',
    { watch_region: region, language: 'en-US' },
    24 * HOUR,
  );
  const priority = (p: (typeof r.results)[number]) => p.display_priorities?.[region] ?? p.display_priority ?? 999;
  return [...r.results].sort((a, b) => priority(a) - priority(b)).map(mapProvider);
}

/** The movie's best YouTube trailer, or null when TMDB lists none. */
export async function trailer(id: number): Promise<Trailer | null> {
  const r = await tmdbGet<{ results?: TmdbVideo[] }>(
    `/movie/${id}/videos`,
    { language: 'en-US', include_video_language: 'en,null' },
    24 * HOUR,
  );
  return pickTrailer(r.results);
}

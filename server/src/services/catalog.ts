import type { Availability, Movie, Provider, Region, SearchResult } from '../../../shared/types';
import type { DB } from '../db';
import { TmdbClient } from '../tmdb/client';
import {
  emptyAvailability,
  mapAvailability,
  mapDetails,
  mapListItem,
  mapProvider,
  type TmdbMovieDetails,
  type TmdbMovieListItem,
  type TmdbPaged,
  type TmdbProvider,
  type TmdbWatchProviders,
} from '../tmdb/mappers';

const HOUR = 60 * 60 * 1000;
export const AVAILABILITY_TTL_MS = 12 * HOUR;
const RESULT_LIMIT = 6;

/**
 * Everything that talks to TMDB. Availability is cached in SQLite per
 * (movie, region) so the watchlist renders without an API call per card.
 */
export class CatalogService {
  private genreMap?: Promise<Map<number, string>>;

  constructor(private tmdb: TmdbClient, private db: DB, private now: () => number = Date.now) {}

  private genres(): Promise<Map<number, string>> {
    if (!this.genreMap) {
      this.genreMap = this.tmdb
        .get<{ genres: { id: number; name: string }[] }>('/genre/movie/list', { language: 'en-US' }, 24 * HOUR)
        .then((r) => new Map(r.genres.map((g) => [g.id, g.name])))
        .catch((err) => {
          this.genreMap = undefined;
          throw err;
        });
    }
    return this.genreMap;
  }

  async search(query: string, region: Region): Promise<SearchResult[]> {
    const page = await this.tmdb.get<TmdbPaged<TmdbMovieListItem>>('/search/movie', {
      query,
      include_adult: false,
      language: 'en-US',
      page: 1,
    });
    return this.withAvailability(page.results.slice(0, RESULT_LIMIT), region);
  }

  async trending(region: Region): Promise<SearchResult[]> {
    const page = await this.tmdb.get<TmdbPaged<TmdbMovieListItem>>('/trending/movie/week', { language: 'en-US' }, HOUR);
    return this.withAvailability(page.results.slice(0, RESULT_LIMIT), region);
  }

  private async withAvailability(items: TmdbMovieListItem[], region: Region): Promise<SearchResult[]> {
    const genres = await this.genres();
    return Promise.all(
      items.map(async (item) => ({
        ...mapListItem(item, genres),
        availability: await this.availability(item.id, region).catch(() => emptyAvailability(region)),
      })),
    );
  }

  /** Full details plus availability; also refreshes the availability cache. */
  async details(id: number, region: Region): Promise<{ movie: Movie; availability: Availability }> {
    const d = await this.tmdb.get<TmdbMovieDetails>(`/movie/${id}`, {
      language: 'en-US',
      append_to_response: 'watch/providers',
    });
    const providers = d['watch/providers'];
    if (providers) this.storeAllRegions(id, providers);
    return {
      movie: mapDetails(d),
      availability: mapAvailability(region, providers?.results?.[region]),
    };
  }

  /** Cached availability for one movie in one region. */
  async availability(id: number, region: Region, maxAgeMs = AVAILABILITY_TTL_MS): Promise<Availability> {
    const cached = this.cached(id, region, maxAgeMs);
    if (cached) return cached;
    const raw = await this.tmdb.get<TmdbWatchProviders>(`/movie/${id}/watch/providers`);
    this.storeAllRegions(id, raw);
    return mapAvailability(region, raw.results?.[region]);
  }

  /** Read from the cache only, if not older than the TTL. */
  freshAvailability(id: number, region: Region): Availability | null {
    return this.cached(id, region, AVAILABILITY_TTL_MS);
  }

  /** Read from the cache only, ignoring age (used as a fallback when TMDB is down). */
  cachedAvailability(id: number, region: Region): Availability | null {
    return this.cached(id, region, Infinity);
  }

  private cached(id: number, region: Region, maxAgeMs: number): Availability | null {
    const row = this.db
      .prepare('SELECT json, fetched_at FROM availability_cache WHERE tmdb_id = ? AND region = ?')
      .get(id, region) as { json: string; fetched_at: number } | undefined;
    if (!row || this.now() - row.fetched_at > maxAgeMs) return null;
    return JSON.parse(row.json) as Availability;
  }

  /** The watch/providers response contains every country — cache the ones we support. */
  private storeAllRegions(id: number, raw: TmdbWatchProviders) {
    const stmt = this.db.prepare(
      `INSERT INTO availability_cache (tmdb_id, region, json, fetched_at) VALUES (?, ?, ?, ?)
       ON CONFLICT (tmdb_id, region) DO UPDATE SET json = excluded.json, fetched_at = excluded.fetched_at`,
    );
    const at = this.now();
    const tx = this.db.transaction(() => {
      for (const region of ['CA', 'US', 'GB'] as Region[]) {
        stmt.run(id, region, JSON.stringify(mapAvailability(region, raw.results?.[region])), at);
      }
    });
    tx();
  }

  /** Streaming services available in a region, most popular first. */
  async providers(region: Region): Promise<Provider[]> {
    const r = await this.tmdb.get<{ results: TmdbProvider[] }>(
      '/watch/providers/movie',
      { watch_region: region, language: 'en-US' },
      24 * HOUR,
    );
    const priority = (p: TmdbProvider) =>
      (p as TmdbProvider & { display_priorities?: Record<string, number> }).display_priorities?.[region] ??
      p.display_priority ??
      999;
    return [...r.results].sort((a, b) => priority(a) - priority(b)).map(mapProvider);
  }
}

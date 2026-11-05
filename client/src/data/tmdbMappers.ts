import type { Availability, Movie, Provider, Region } from '../../../shared/types';

// ---- Raw TMDB shapes (only the fields we use) ----

export interface TmdbProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority?: number;
}

export interface TmdbRegionProviders {
  link?: string;
  flatrate?: TmdbProvider[];
  free?: TmdbProvider[];
  ads?: TmdbProvider[];
  rent?: TmdbProvider[];
  buy?: TmdbProvider[];
}

export interface TmdbWatchProviders {
  results?: Partial<Record<string, TmdbRegionProviders>>;
}

export interface TmdbMovieListItem {
  id: number;
  title: string;
  release_date?: string;
  genre_ids?: number[];
  vote_average?: number;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  media_type?: string;
}

export interface TmdbMovieDetails extends Omit<TmdbMovieListItem, 'genre_ids'> {
  runtime?: number | null;
  genres?: { id: number; name: string }[];
  'watch/providers'?: TmdbWatchProviders;
}

export interface TmdbPaged<T> {
  results: T[];
}

// ---- Mappers ----

const year = (date?: string) => {
  const y = date ? Number(date.slice(0, 4)) : NaN;
  return Number.isFinite(y) && y > 0 ? y : null;
};

const round1 = (n?: number) => Math.round((n ?? 0) * 10) / 10;

export function mapListItem(item: TmdbMovieListItem, genreNames: Map<number, string>): Movie {
  return {
    id: item.id,
    title: item.title,
    year: year(item.release_date),
    runtime: null,
    genres: (item.genre_ids ?? []).map((g) => genreNames.get(g)).filter((g): g is string => !!g),
    score: round1(item.vote_average),
    overview: item.overview ?? '',
    posterPath: item.poster_path ?? null,
    backdropPath: item.backdrop_path ?? null,
  };
}

export function mapDetails(d: TmdbMovieDetails): Movie {
  return {
    id: d.id,
    title: d.title,
    year: year(d.release_date),
    runtime: d.runtime || null,
    genres: (d.genres ?? []).map((g) => g.name),
    score: round1(d.vote_average),
    overview: d.overview ?? '',
    posterPath: d.poster_path ?? null,
    backdropPath: d.backdrop_path ?? null,
  };
}

export function mapProvider(p: TmdbProvider): Provider {
  return { id: p.provider_id, name: p.provider_name, logoPath: p.logo_path ?? null };
}

const sortByPriority = (list: TmdbProvider[] = []) =>
  [...list].sort((a, b) => (a.display_priority ?? 999) - (b.display_priority ?? 999));

/** Dedupe by provider id, keeping the first occurrence. */
function unique(list: TmdbProvider[]): Provider[] {
  const seen = new Set<number>();
  const out: Provider[] = [];
  for (const p of list) {
    if (seen.has(p.provider_id)) continue;
    seen.add(p.provider_id);
    out.push(mapProvider(p));
  }
  return out;
}

export function mapAvailability(region: Region, raw?: TmdbRegionProviders): Availability {
  return {
    region,
    stream: unique([
      ...sortByPriority(raw?.flatrate),
      ...sortByPriority(raw?.free),
      ...sortByPriority(raw?.ads),
    ]),
    rent: unique(sortByPriority(raw?.rent)),
    buy: unique(sortByPriority(raw?.buy)),
    link: raw?.link ?? null,
  };
}

export const emptyAvailability = (region: Region): Availability => mapAvailability(region);

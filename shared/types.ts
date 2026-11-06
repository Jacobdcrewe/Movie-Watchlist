// Types shared by the Express API and the React client.

export type Region = 'CA' | 'US' | 'GB';
export const REGIONS: Record<Region, string> = {
  CA: 'Canada',
  US: 'United States',
  GB: 'United Kingdom',
};

export type Theme = 'dark' | 'light';

/** A streaming / rental / purchase provider (TMDB watch provider). */
export interface Provider {
  id: number;
  name: string;
  logoPath: string | null;
}

/** Where a movie can be watched in one region. */
export interface Availability {
  region: Region;
  /** Subscription, free and ad-supported providers. */
  stream: Provider[];
  rent: Provider[];
  buy: Provider[];
  /** TMDB / JustWatch deep link for the region, if any. */
  link: string | null;
}

/** Movie metadata snapshot. */
export interface Movie {
  id: number;
  title: string;
  year: number | null;
  runtime: number | null;
  genres: string[];
  score: number;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
}

/** A movie's trailer: a YouTube video key. */
export interface Trailer {
  key: string;
  name: string;
}

/** A search / trending result with availability for the requested region. */
export interface SearchResult extends Movie {
  availability: Availability;
}

export interface WatchlistEntry {
  movie: Movie;
  addedAt: number;
  watched: boolean;
  /** 0 = not rated, 1–5 stars. */
  rating: number;
  note: string;
  availability: Availability;
}

export interface WatchlistPatch {
  watched?: boolean;
  rating?: number;
  note?: string;
}

export interface Settings {
  region: Region;
  /** TMDB provider ids the user subscribes to. */
  myServices: number[];
  theme: Theme;
  /** The list that was open last (null → first list). */
  currentListId: string | null;
}

/** Your access to a list. */
export type ListRole = 'owner' | 'editor' | 'viewer';

/** A named watchlist you own or that's shared with you. */
export interface WatchList {
  id: string;
  name: string;
  ownerId: string;
  role: ListRole;
  /** True when other people have access (only known for lists you own). */
  shared: boolean;
}

/** Someone with access to a list. */
export interface ListPerson {
  userId: string;
  email: string;
  role: ListRole;
}

export interface ApiError {
  error: string;
}

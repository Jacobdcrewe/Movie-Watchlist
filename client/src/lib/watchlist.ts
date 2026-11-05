import type { WatchlistEntry } from '../../../shared/types';
import { runtime } from './format';

export type Tab = 'towatch' | 'watched' | 'all';
export type SortKey = 'added' | 'rating' | 'runtime' | 'year' | 'title';
export type ViewMode = 'grid' | 'list';

export const TABS: { key: Tab; label: string }[] = [
  { key: 'towatch', label: 'To watch' },
  { key: 'watched', label: 'Watched' },
  { key: 'all', label: 'All' },
];

export const SORTS: { key: SortKey; label: string }[] = [
  { key: 'added', label: 'Recently added' },
  { key: 'rating', label: 'Rating' },
  { key: 'runtime', label: 'Runtime' },
  { key: 'year', label: 'Release year' },
  { key: 'title', label: 'Title' },
];

export interface Filters {
  tab: Tab;
  genre: string; // 'All' or a genre name
  onlyMine: boolean;
  myServices: number[];
}

export const isOnMyServices = (e: WatchlistEntry, myServices: number[]) =>
  e.availability.stream.some((p) => myServices.includes(p.id));

export function tabCounts(entries: WatchlistEntry[]): Record<Tab, number> {
  const watched = entries.filter((e) => e.watched).length;
  return { towatch: entries.length - watched, watched, all: entries.length };
}

export function filterEntries(entries: WatchlistEntry[], f: Filters): WatchlistEntry[] {
  return entries.filter(
    (e) =>
      (f.tab === 'all' || (f.tab === 'watched') === e.watched) &&
      (f.genre === 'All' || e.movie.genres.includes(f.genre)) &&
      (!f.onlyMine || isOnMyServices(e, f.myServices)),
  );
}

/** Your own rating (×2 to match the 10-point scale) wins; otherwise the critics' score. */
const effectiveRating = (e: WatchlistEntry) => e.rating * 2 || e.movie.score;

const comparators: Record<SortKey, (a: WatchlistEntry, b: WatchlistEntry) => number> = {
  added: (a, b) => b.addedAt - a.addedAt,
  title: (a, b) => a.movie.title.localeCompare(b.movie.title),
  year: (a, b) => (b.movie.year ?? 0) - (a.movie.year ?? 0),
  runtime: (a, b) => (a.movie.runtime ?? Infinity) - (b.movie.runtime ?? Infinity),
  rating: (a, b) => effectiveRating(b) - effectiveRating(a),
};

export const sortEntries = (entries: WatchlistEntry[], key: SortKey) => [...entries].sort(comparators[key]);

export const genresOf = (entries: WatchlistEntry[]) => [
  'All',
  ...Array.from(new Set(entries.flatMap((e) => e.movie.genres))).sort(),
];

export function summary(entries: WatchlistEntry[], myServices: number[]): string {
  const unwatched = entries.filter((e) => !e.watched);
  const minutes = unwatched.reduce((sum, e) => sum + (e.movie.runtime ?? 0), 0);
  const onMine = unwatched.filter((e) => isOnMyServices(e, myServices)).length;
  return `${unwatched.length} to watch · ${runtime(minutes) || '0m'} total · ${onMine} on your services`;
}

export function emptyState(hasEntries: boolean, regionName: string) {
  return hasEntries
    ? { title: 'Nothing matches these filters', body: 'Try another genre, or turn off “Only on my services”.' }
    : {
        title: 'Your watchlist is empty',
        body: `Search for a movie above and add it — we’ll show where it’s streaming in ${regionName}.`,
      };
}

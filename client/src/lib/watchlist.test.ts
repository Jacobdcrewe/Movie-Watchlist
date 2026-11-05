import { describe, expect, it } from 'vitest';
import type { WatchlistEntry } from '../../../shared/types';
import { runtime } from './format';
import { emptyState, filterEntries, genresOf, sortEntries, summary, tabCounts } from './watchlist';

const entry = (id: number, o: Partial<WatchlistEntry> & { title?: string; genres?: string[]; runtime?: number; year?: number; score?: number; stream?: number[] } = {}): WatchlistEntry => ({
  movie: {
    id,
    title: o.title ?? `Movie ${id}`,
    year: o.year ?? 2000 + id,
    runtime: o.runtime ?? 100,
    genres: o.genres ?? ['Drama'],
    score: o.score ?? 7,
    overview: '',
    posterPath: null,
    backdropPath: null,
  },
  addedAt: o.addedAt ?? id,
  watched: o.watched ?? false,
  rating: o.rating ?? 0,
  note: '',
  availability: {
    region: 'CA',
    stream: (o.stream ?? []).map((p) => ({ id: p, name: `P${p}`, logoPath: null })),
    rent: [],
    buy: [],
    link: null,
  },
});

const list = [
  entry(1, { title: 'Zodiac', genres: ['Thriller'], runtime: 157, score: 7.7, stream: [8] }),
  entry(2, { title: 'Arrival', genres: ['Sci-Fi', 'Drama'], runtime: 116, score: 7.9, watched: true, rating: 5 }),
  entry(3, { title: 'Barbie', genres: ['Comedy'], runtime: 114, score: 6.8, stream: [230] }),
];

describe('watchlist helpers', () => {
  it('formats runtime', () => {
    expect(runtime(166)).toBe('2h 46m');
    expect(runtime(45)).toBe('45m');
    expect(runtime(null)).toBe('');
  });

  it('counts tabs', () => {
    expect(tabCounts(list)).toEqual({ towatch: 2, watched: 1, all: 3 });
  });

  it('filters by tab, genre and my services', () => {
    const base = { tab: 'all' as const, genre: 'All', onlyMine: false, myServices: [8] };
    expect(filterEntries(list, { ...base, tab: 'towatch' }).map((e) => e.movie.id)).toEqual([1, 3]);
    expect(filterEntries(list, { ...base, tab: 'watched' }).map((e) => e.movie.id)).toEqual([2]);
    expect(filterEntries(list, { ...base, genre: 'Drama' }).map((e) => e.movie.id)).toEqual([2]);
    expect(filterEntries(list, { ...base, onlyMine: true }).map((e) => e.movie.id)).toEqual([1]);
  });

  it('sorts', () => {
    const ids = (k: Parameters<typeof sortEntries>[1]) => sortEntries(list, k).map((e) => e.movie.id);
    expect(ids('added')).toEqual([3, 2, 1]);
    expect(ids('title')).toEqual([2, 3, 1]);
    expect(ids('runtime')).toEqual([3, 2, 1]);
    expect(ids('year')).toEqual([3, 2, 1]);
    expect(ids('rating')).toEqual([2, 1, 3]); // 5★ → 10 beats critics' 7.7
  });

  it('lists genres and summarizes', () => {
    expect(genresOf(list)).toEqual(['All', 'Comedy', 'Drama', 'Sci-Fi', 'Thriller']);
    expect(summary(list, [8, 230])).toBe('2 to watch · 4h 31m total · 2 on your services');
    expect(emptyState(false, 'Canada').body).toContain('Canada');
  });
});

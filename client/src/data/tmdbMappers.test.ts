import { describe, expect, it } from 'vitest';
import { mapLimit } from './catalog';
import { mapAvailability, mapDetails, mapListItem, pickTrailer, type TmdbVideo } from './tmdbMappers';

const CA = {
  link: 'https://www.themoviedb.org/movie/1/watch?locale=CA',
  flatrate: [
    { provider_id: 230, provider_name: 'Crave', logo_path: '/crave.png', display_priority: 2 },
    { provider_id: 8, provider_name: 'Netflix', logo_path: '/nf.png', display_priority: 1 },
  ],
  ads: [{ provider_id: 73, provider_name: 'Tubi', logo_path: '/tubi.png', display_priority: 5 }],
  rent: [{ provider_id: 2, provider_name: 'Apple TV', logo_path: '/a.png', display_priority: 1 }],
  buy: [{ provider_id: 2, provider_name: 'Apple TV', logo_path: '/a.png', display_priority: 1 }],
};

describe('TMDB mappers', () => {
  it('groups flatrate/free/ads as stream, sorted by priority and deduped', () => {
    const a = mapAvailability('CA', CA);
    expect(a.stream.map((p) => p.name)).toEqual(['Netflix', 'Crave', 'Tubi']);
    expect(a.rent.map((p) => p.name)).toEqual(['Apple TV']);
    expect(a.buy).toHaveLength(1);
    expect(a.link).toContain('locale=CA');
  });

  it('returns empty lists for a missing region', () => {
    expect(mapAvailability('GB', undefined)).toEqual({ region: 'GB', stream: [], rent: [], buy: [], link: null });
  });

  it('maps details and list items', () => {
    const d = mapDetails({
      id: 1,
      title: 'Dune: Part Two',
      release_date: '2024-03-01',
      runtime: 166,
      genres: [{ id: 878, name: 'Science Fiction' }],
      vote_average: 8.24,
    });
    expect(d).toMatchObject({ year: 2024, runtime: 166, genres: ['Science Fiction'], score: 8.2, posterPath: null });

    const item = mapListItem({ id: 2, title: 'X', genre_ids: [878, 999] }, new Map([[878, 'Science Fiction']]));
    expect(item).toMatchObject({ year: null, runtime: null, genres: ['Science Fiction'] });
  });
});

describe('mapLimit', () => {
  it('preserves order and caps concurrency', async () => {
    let inFlight = 0;
    let peak = 0;
    const out = await mapLimit([1, 2, 3, 4, 5, 6, 7], 3, async (n) => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight--;
      return n * 2;
    });
    expect(out).toEqual([2, 4, 6, 8, 10, 12, 14]);
    expect(peak).toBe(3);
  });
});

describe('pickTrailer', () => {
  const v = (o: Partial<TmdbVideo>): TmdbVideo => ({
    key: 'k',
    name: 'n',
    site: 'YouTube',
    type: 'Trailer',
    official: true,
    iso_639_1: 'en',
    published_at: '2023-01-01',
    ...o,
  });

  it('prefers an official English trailer, newest first', () => {
    const t = pickTrailer([
      v({ key: 'teaser', type: 'Teaser' }),
      v({ key: 'fan', official: false }),
      v({ key: 'fr', iso_639_1: 'fr' }),
      v({ key: 'old', published_at: '2022-05-01' }),
      v({ key: 'new', published_at: '2023-06-01' }),
    ]);
    expect(t?.key).toBe('new');
  });

  it('falls back to a teaser and ignores other sites and types', () => {
    expect(pickTrailer([v({ key: 'vim', site: 'Vimeo' }), v({ key: 'clip', type: 'Clip' }), v({ key: 'tz', type: 'Teaser' })])?.key).toBe('tz');
  });

  it('returns null when there is nothing playable', () => {
    expect(pickTrailer([])).toBeNull();
    expect(pickTrailer(undefined)).toBeNull();
  });
});

import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';
import { openDatabase } from '../src/db';
import { TmdbClient } from '../src/tmdb/client';
import { mapAvailability } from '../src/tmdb/mappers';

const providers = {
  results: {
    CA: {
      link: 'https://www.themoviedb.org/movie/1/watch?locale=CA',
      flatrate: [
        { provider_id: 230, provider_name: 'Crave', logo_path: '/crave.png', display_priority: 2 },
        { provider_id: 8, provider_name: 'Netflix', logo_path: '/nf.png', display_priority: 1 },
      ],
      ads: [{ provider_id: 73, provider_name: 'Tubi', logo_path: '/tubi.png', display_priority: 5 }],
      rent: [{ provider_id: 2, provider_name: 'Apple TV', logo_path: '/a.png', display_priority: 1 }],
      buy: [{ provider_id: 2, provider_name: 'Apple TV', logo_path: '/a.png', display_priority: 1 }],
    },
    US: { flatrate: [{ provider_id: 1899, provider_name: 'Max', logo_path: '/max.png' }] },
  },
};

const details = {
  id: 1,
  title: 'Dune: Part Two',
  release_date: '2024-03-01',
  runtime: 166,
  genres: [
    { id: 878, name: 'Science Fiction' },
    { id: 12, name: 'Adventure' },
  ],
  vote_average: 8.24,
  overview: 'Paul Atreides unites with the Fremen.',
  poster_path: '/p.jpg',
  backdrop_path: '/b.jpg',
  'watch/providers': providers,
};

function fakeFetch() {
  return vi.fn(async (input: URL | RequestInfo, _init?: RequestInit) => {
    const url = new URL(String(input));
    const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
    switch (true) {
      case url.pathname.endsWith('/genre/movie/list'):
        return json({ genres: [{ id: 878, name: 'Science Fiction' }, { id: 12, name: 'Adventure' }] });
      case url.pathname.endsWith('/search/movie'):
        return json({ results: [{ id: 1, title: 'Dune: Part Two', release_date: '2024-03-01', genre_ids: [878], vote_average: 8.2 }] });
      case url.pathname.endsWith('/trending/movie/week'):
        return json({ results: [{ id: 1, title: 'Dune: Part Two', genre_ids: [12] }] });
      case url.pathname.endsWith('/movie/1/watch/providers'):
        return json(providers);
      case url.pathname.endsWith('/movie/1'):
        return json(details);
      case url.pathname.endsWith('/watch/providers/movie'):
        return json({
          results: [
            { provider_id: 230, provider_name: 'Crave', logo_path: null, display_priorities: { CA: 3 } },
            { provider_id: 8, provider_name: 'Netflix', logo_path: null, display_priorities: { CA: 1 } },
          ],
        });
      default:
        return json({ status_message: 'The resource you requested could not be found.' }, 404);
    }
  });
}

function setup(now = () => 1_000_000) {
  const fetchImpl = fakeFetch();
  const db = openDatabase(':memory:');
  const tmdb = new TmdbClient({ readToken: 'test', fetchImpl: fetchImpl as unknown as typeof fetch, cacheTtlMs: 0 });
  return { app: createApp({ db, tmdb, now }), fetchImpl, db };
}

describe('availability mapping', () => {
  it('groups flatrate/free/ads as stream, sorted by priority and deduped', () => {
    const a = mapAvailability('CA', providers.results.CA);
    expect(a.stream.map((p) => p.name)).toEqual(['Netflix', 'Crave', 'Tubi']);
    expect(a.rent.map((p) => p.name)).toEqual(['Apple TV']);
    expect(a.buy).toHaveLength(1);
    expect(a.link).toContain('locale=CA');
  });
  it('returns empty lists for a missing region', () => {
    expect(mapAvailability('GB', undefined)).toEqual({ region: 'GB', stream: [], rent: [], buy: [], link: null });
  });
});

describe('catalog routes', () => {
  let ctx: ReturnType<typeof setup>;
  beforeEach(() => (ctx = setup()));

  it('searches with genres and availability', async () => {
    const res = await request(ctx.app).get('/api/search?q=dune&region=CA').expect(200);
    expect(res.body[0]).toMatchObject({ id: 1, title: 'Dune: Part Two', year: 2024, genres: ['Science Fiction'] });
    expect(res.body[0].availability.stream[0].name).toBe('Netflix');
    const auth = (ctx.fetchImpl.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(auth.authorization).toBe('Bearer test');
  });

  it('returns trending when the query is empty', async () => {
    const res = await request(ctx.app).get('/api/search?region=US').expect(200);
    expect(res.body[0].availability.stream[0].name).toBe('Max');
  });

  it('sorts providers by regional priority', async () => {
    const res = await request(ctx.app).get('/api/providers?region=CA').expect(200);
    expect(res.body.map((p: { name: string }) => p.name)).toEqual(['Netflix', 'Crave']);
  });

  it('rejects invalid regions', async () => {
    const res = await request(ctx.app).get('/api/search?q=x&region=FR').expect(400);
    expect(res.body.error).toMatch(/region/);
  });

  it('surfaces TMDB 404s', async () => {
    await request(ctx.app).get('/api/movies/999').expect(404);
  });
});

describe('watchlist routes', () => {
  let ctx: ReturnType<typeof setup>;
  beforeEach(() => (ctx = setup()));

  it('adds, updates, lists and removes', async () => {
    const added = await request(ctx.app).post('/api/watchlist?region=CA').send({ tmdbId: 1 }).expect(201);
    expect(added.body.movie).toMatchObject({ title: 'Dune: Part Two', runtime: 166, genres: ['Science Fiction', 'Adventure'] });
    expect(added.body).toMatchObject({ watched: false, rating: 0, note: '' });

    await request(ctx.app).post('/api/watchlist').send({ tmdbId: 1 }).expect(200); // idempotent

    const patched = await request(ctx.app)
      .patch('/api/watchlist/1')
      .send({ watched: true, rating: 4, note: 'Watch in IMAX' })
      .expect(200);
    expect(patched.body).toMatchObject({ watched: true, rating: 4, note: 'Watch in IMAX' });

    const list = await request(ctx.app).get('/api/watchlist?region=US').expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].availability.stream[0].name).toBe('Max');

    await request(ctx.app).delete('/api/watchlist/1').expect(204);
    await request(ctx.app).delete('/api/watchlist/1').expect(404);
    expect((await request(ctx.app).get('/api/watchlist')).body).toEqual([]);
  });

  it('validates patches', async () => {
    await request(ctx.app).post('/api/watchlist').send({ tmdbId: 1 });
    await request(ctx.app).patch('/api/watchlist/1').send({ rating: 9 }).expect(400);
    await request(ctx.app).patch('/api/watchlist/1').send({ bogus: true }).expect(400);
    await request(ctx.app).patch('/api/watchlist/2').send({ watched: true }).expect(404);
  });

  it('serves availability from the SQLite cache without refetching', async () => {
    await request(ctx.app).post('/api/watchlist').send({ tmdbId: 1 });
    const calls = ctx.fetchImpl.mock.calls.length;
    await request(ctx.app).get('/api/watchlist?region=GB').expect(200);
    await request(ctx.app).get('/api/watchlist?region=CA').expect(200);
    expect(ctx.fetchImpl.mock.calls.length).toBe(calls);
  });

  it('refetches stale availability after the TTL', async () => {
    let t = 0;
    ctx = setup(() => t);
    await request(ctx.app).post('/api/watchlist').send({ tmdbId: 1 });
    const calls = ctx.fetchImpl.mock.calls.length;
    t = 13 * 60 * 60 * 1000;
    await request(ctx.app).get('/api/watchlist?region=CA').expect(200);
    expect(ctx.fetchImpl.mock.calls.length).toBe(calls + 1);
  });
});

describe('settings routes', () => {
  it('returns defaults and persists updates', async () => {
    const { app } = setup();
    expect((await request(app).get('/api/settings')).body).toEqual({ region: 'CA', myServices: [], theme: 'dark' });
    const res = await request(app).put('/api/settings').send({ region: 'GB', myServices: [8, 230] }).expect(200);
    expect(res.body).toEqual({ region: 'GB', myServices: [8, 230], theme: 'dark' });
    await request(app).put('/api/settings').send({ theme: 'blue' }).expect(400);
  });
});

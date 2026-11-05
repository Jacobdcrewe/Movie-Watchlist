import type { Movie, Region, Settings, WatchlistEntry, WatchlistPatch } from '../../../shared/types';
import type { DB } from '../db';
import { emptyAvailability } from '../tmdb/mappers';
import type { CatalogService } from './catalog';

interface Row {
  tmdb_id: number;
  added_at: number;
  watched: number;
  rating: number;
  note: string;
  movie_json: string;
}

/** How many stale availability entries to refresh from TMDB per list request. */
const REFRESH_BATCH = 8;

export class WatchlistService {
  constructor(private db: DB, private catalog: CatalogService, private now: () => number = Date.now) {}

  private rows(): Row[] {
    return this.db.prepare('SELECT * FROM watchlist_items ORDER BY added_at DESC').all() as Row[];
  }

  private row(id: number): Row | undefined {
    return this.db.prepare('SELECT * FROM watchlist_items WHERE tmdb_id = ?').get(id) as Row | undefined;
  }

  has(id: number): boolean {
    return !!this.row(id);
  }

  async list(region: Region): Promise<WatchlistEntry[]> {
    const rows = this.rows();
    // Fresh cache → no network. Stale/missing → refresh a limited batch from TMDB
    // (the rest fall back to stale data and get refreshed on subsequent loads).
    let budget = REFRESH_BATCH;
    return Promise.all(
      rows.map(async (r) => {
        const fresh = this.catalog.freshAvailability(r.tmdb_id, region);
        if (fresh) return this.toEntry(r, fresh);
        const stale = this.catalog.cachedAvailability(r.tmdb_id, region);
        if (budget > 0 || !stale) {
          budget--;
          const fetched = await this.catalog.availability(r.tmdb_id, region).catch(() => null);
          if (fetched) return this.toEntry(r, fetched);
        }
        return this.toEntry(r, stale ?? emptyAvailability(region));
      }),
    );
  }

  async get(id: number, region: Region): Promise<WatchlistEntry | null> {
    const r = this.row(id);
    if (!r) return null;
    const availability = await this.catalog
      .availability(id, region)
      .catch(() => this.catalog.cachedAvailability(id, region) ?? emptyAvailability(region));
    return this.toEntry(r, availability);
  }

  /** Adds a movie (idempotent). Fetches full details so runtime/genres are stored. */
  async add(id: number, region: Region): Promise<WatchlistEntry> {
    const existing = this.row(id);
    if (existing) return (await this.get(id, region))!;
    const { movie, availability } = await this.catalog.details(id, region);
    this.db
      .prepare('INSERT INTO watchlist_items (tmdb_id, added_at, movie_json) VALUES (?, ?, ?)')
      .run(id, this.now(), JSON.stringify(movie));
    return this.toEntry(this.row(id)!, availability);
  }

  update(id: number, patch: WatchlistPatch): boolean {
    const sets: string[] = [];
    const values: (number | string)[] = [];
    if (patch.watched !== undefined) {
      sets.push('watched = ?');
      values.push(patch.watched ? 1 : 0);
    }
    if (patch.rating !== undefined) {
      sets.push('rating = ?');
      values.push(patch.rating);
    }
    if (patch.note !== undefined) {
      sets.push('note = ?');
      values.push(patch.note);
    }
    if (!sets.length) return this.has(id);
    const res = this.db.prepare(`UPDATE watchlist_items SET ${sets.join(', ')} WHERE tmdb_id = ?`).run(...values, id);
    return res.changes > 0;
  }

  remove(id: number): boolean {
    return this.db.prepare('DELETE FROM watchlist_items WHERE tmdb_id = ?').run(id).changes > 0;
  }

  private toEntry(r: Row, availability: WatchlistEntry['availability']): WatchlistEntry {
    return {
      movie: JSON.parse(r.movie_json) as Movie,
      addedAt: r.added_at,
      watched: !!r.watched,
      rating: r.rating,
      note: r.note,
      availability,
    };
  }
}

const DEFAULT_SETTINGS: Settings = { region: 'CA', myServices: [], theme: 'dark' };

export class SettingsService {
  constructor(private db: DB) {}

  get(): Settings {
    const rows = this.db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    const stored = Object.fromEntries(rows.map((r) => [r.key, JSON.parse(r.value)]));
    return { ...DEFAULT_SETTINGS, ...stored };
  }

  update(patch: Partial<Settings>): Settings {
    const stmt = this.db.prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value',
    );
    const tx = this.db.transaction(() => {
      for (const [k, v] of Object.entries(patch)) if (v !== undefined) stmt.run(k, JSON.stringify(v));
    });
    tx();
    return this.get();
  }
}

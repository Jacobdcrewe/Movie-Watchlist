import type { Movie, Region, Settings, WatchlistEntry, WatchlistPatch } from '../../../shared/types';
import { availability, details, mapLimit } from './catalog';
import { ApiError } from './errors';
import { supabase } from './supabase';
import { emptyAvailability } from './tmdbMappers';

/** Row shape of public.watchlist_items (see supabase/schema.sql). */
interface ItemRow {
  tmdb_id: number;
  added_at: string;
  watched: boolean;
  rating: number;
  note: string;
  movie: Movie;
}

interface SettingsRow {
  region: Region;
  my_services: number[];
  theme: Settings['theme'];
}

const ITEM_COLUMNS = 'tmdb_id, added_at, watched, rating, note, movie';
const DEFAULT_SETTINGS: Settings = { region: 'CA', myServices: [], theme: 'dark' };

function fail(error: { message: string; code?: string } | null, fallback = 'Database request failed'): never {
  throw new ApiError(error?.message || fallback, 500);
}

/** The signed-in user's id (row-level security also enforces this server-side). */
async function userId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new ApiError('You are signed out. Please sign in again.', 401);
  return id;
}

async function toEntry(row: ItemRow, region: Region): Promise<WatchlistEntry> {
  return {
    movie: row.movie,
    addedAt: Date.parse(row.added_at),
    watched: row.watched,
    rating: row.rating,
    note: row.note,
    availability: await availability(row.tmdb_id, region).catch(() => emptyAvailability(region)),
  };
}

// ---------- Watchlist ----------

export async function listWatchlist(region: Region): Promise<WatchlistEntry[]> {
  const { data, error } = await supabase.from('watchlist_items').select(ITEM_COLUMNS).order('added_at', { ascending: false });
  if (error) fail(error);
  return mapLimit((data ?? []) as ItemRow[], 6, (row) => toEntry(row, region));
}

/** Adds a movie (idempotent). Fetches full details so runtime and genres are stored. */
export async function addToWatchlist(tmdbId: number, region: Region): Promise<WatchlistEntry> {
  const { movie, availability: avail } = await details(tmdbId, region);
  const { data, error } = await supabase
    .from('watchlist_items')
    .upsert({ user_id: await userId(), tmdb_id: tmdbId, movie }, { onConflict: 'user_id,tmdb_id', ignoreDuplicates: true })
    .select(ITEM_COLUMNS)
    .maybeSingle();
  if (error) fail(error);
  if (data) return { ...(await toEntry(data as ItemRow, region)), availability: avail };
  // Already existed (ignored duplicate) — return the stored row.
  const existing = await supabase.from('watchlist_items').select(ITEM_COLUMNS).eq('tmdb_id', tmdbId).single();
  if (existing.error) fail(existing.error);
  return toEntry(existing.data as ItemRow, region);
}

export async function updateWatchlist(tmdbId: number, patch: WatchlistPatch): Promise<void> {
  const { error, count } = await supabase.from('watchlist_items').update(patch, { count: 'exact' }).eq('tmdb_id', tmdbId);
  if (error) fail(error);
  if (count === 0) throw new ApiError('Not in watchlist', 404);
}

export async function removeFromWatchlist(tmdbId: number): Promise<void> {
  const { error } = await supabase.from('watchlist_items').delete().eq('tmdb_id', tmdbId);
  if (error) fail(error);
}

// ---------- Settings ----------

export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabase.from('user_settings').select('region, my_services, theme').maybeSingle();
  if (error) fail(error);
  if (!data) return DEFAULT_SETTINGS;
  const row = data as SettingsRow;
  return { region: row.region, myServices: row.my_services ?? [], theme: row.theme };
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  const row: Partial<SettingsRow> & { user_id: string } = { user_id: await userId() };
  if (patch.region) row.region = patch.region;
  if (patch.myServices) row.my_services = patch.myServices;
  if (patch.theme) row.theme = patch.theme;
  // Upsert so the first save creates the row.
  const { error } = await supabase.from('user_settings').upsert(row, { onConflict: 'user_id' });
  if (error) fail(error);
}

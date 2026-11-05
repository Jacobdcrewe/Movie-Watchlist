import type {
  ListPerson,
  ListRole,
  Movie,
  Region,
  Settings,
  WatchList,
  WatchlistEntry,
  WatchlistPatch,
} from '../../../shared/types';
import { availability, details, mapLimit } from './catalog';
import { ApiError } from './errors';
import { supabase } from './supabase';
import { emptyAvailability } from './tmdbMappers';

// Row shapes (see supabase/schema.sql)
interface ItemRow {
  tmdb_id: number;
  added_at: string;
  watched: boolean;
  rating: number;
  note: string;
  movie: Movie;
}

interface ListRow {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  list_members: { user_id: string; role: 'editor' | 'viewer' }[];
}

interface SettingsRow {
  region: Region;
  my_services: number[];
  theme: Settings['theme'];
  current_list: string | null;
}

const ITEM_COLUMNS = 'tmdb_id, added_at, watched, rating, note, movie';
const DEFAULT_SETTINGS: Settings = { region: 'CA', myServices: [], theme: 'dark', currentListId: null };
export const DEFAULT_LIST_NAME = 'My watchlist';

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

// ---------- Lists ----------

function toList(row: ListRow, me: string): WatchList {
  const mine = row.owner_id === me;
  const membership = row.list_members.find((m) => m.user_id === me);
  const role: ListRole = mine ? 'owner' : (membership?.role ?? 'viewer');
  return { id: row.id, name: row.name, ownerId: row.owner_id, role, shared: row.list_members.length > 0 };
}

/** Lists you own (oldest first), then lists shared with you (by name). */
export async function getLists(): Promise<WatchList[]> {
  const me = await userId();
  const { data, error } = await supabase
    .from('lists')
    .select('id, name, owner_id, created_at, list_members(user_id, role)')
    .order('created_at', { ascending: true });
  if (error) fail(error);
  const lists = ((data ?? []) as ListRow[]).map((r) => toList(r, me));
  const owned = lists.filter((l) => l.role === 'owner');
  const shared = lists.filter((l) => l.role !== 'owner').sort((a, b) => a.name.localeCompare(b.name));
  return [...owned, ...shared];
}

let ensuring: Promise<WatchList[]> | null = null;

/** Lists, creating a first "My watchlist" for brand-new accounts. */
export function ensureLists(): Promise<WatchList[]> {
  ensuring ??= (async () => {
    const lists = await getLists();
    if (lists.some((l) => l.role === 'owner')) return lists;
    await createList(DEFAULT_LIST_NAME);
    return getLists();
  })().finally(() => {
    ensuring = null;
  });
  return ensuring;
}

const cleanName = (name: string) => {
  const n = name.trim().slice(0, 60);
  if (!n) throw new ApiError('Give the list a name', 400);
  return n;
};

export async function createList(name: string): Promise<WatchList> {
  const me = await userId();
  const { data, error } = await supabase
    .from('lists')
    .insert({ owner_id: me, name: cleanName(name) })
    .select('id, name, owner_id, created_at')
    .single();
  if (error) fail(error);
  return toList({ ...(data as Omit<ListRow, 'list_members'>), list_members: [] }, me);
}

export async function renameList(id: string, name: string): Promise<void> {
  const { error } = await supabase.from('lists').update({ name: cleanName(name) }).eq('id', id);
  if (error) fail(error);
}

export async function deleteList(id: string): Promise<void> {
  const { error } = await supabase.from('lists').delete().eq('id', id);
  if (error) fail(error);
}

/** Leave a list someone shared with you. */
export async function leaveList(id: string): Promise<void> {
  const { error } = await supabase.from('list_members').delete().eq('list_id', id).eq('user_id', await userId());
  if (error) fail(error);
}

// ---------- Sharing ----------

export async function listPeople(listId: string): Promise<ListPerson[]> {
  const { data, error } = await supabase.rpc('list_people', { lid: listId });
  if (error) fail(error);
  return ((data ?? []) as { user_id: string; email: string; role: ListRole }[]).map((p) => ({
    userId: p.user_id,
    email: p.email,
    role: p.role,
  }));
}

/** Share with someone by email, or change their access. Owner only. */
export async function shareList(listId: string, email: string, role: 'editor' | 'viewer'): Promise<void> {
  const { error } = await supabase.rpc('share_list', { lid: listId, member_email: email.trim(), member_role: role });
  if (error) throw new ApiError(error.message, 400);
}

export async function unshareList(listId: string, memberId: string): Promise<void> {
  const { error } = await supabase.from('list_members').delete().eq('list_id', listId).eq('user_id', memberId);
  if (error) fail(error);
}

// ---------- Items ----------

export async function listWatchlist(listId: string, region: Region): Promise<WatchlistEntry[]> {
  const { data, error } = await supabase
    .from('watchlist_items')
    .select(ITEM_COLUMNS)
    .eq('list_id', listId)
    .order('added_at', { ascending: false });
  if (error) fail(error);
  return mapLimit((data ?? []) as ItemRow[], 6, (row) => toEntry(row, region));
}

/** Adds a movie (idempotent). Fetches full details so runtime and genres are stored. */
export async function addToWatchlist(listId: string, tmdbId: number, region: Region): Promise<WatchlistEntry> {
  const { movie, availability: avail } = await details(tmdbId, region);
  const { data, error } = await supabase
    .from('watchlist_items')
    .upsert({ list_id: listId, tmdb_id: tmdbId, movie }, { onConflict: 'list_id,tmdb_id', ignoreDuplicates: true })
    .select(ITEM_COLUMNS)
    .maybeSingle();
  if (error) fail(error);
  if (data) return { ...(await toEntry(data as ItemRow, region)), availability: avail };
  // Already on the list (ignored duplicate) — return the stored row.
  const existing = await supabase
    .from('watchlist_items')
    .select(ITEM_COLUMNS)
    .eq('list_id', listId)
    .eq('tmdb_id', tmdbId)
    .single();
  if (existing.error) fail(existing.error);
  return toEntry(existing.data as ItemRow, region);
}

export async function updateWatchlist(listId: string, tmdbId: number, patch: WatchlistPatch): Promise<void> {
  const { error, count } = await supabase
    .from('watchlist_items')
    .update(patch, { count: 'exact' })
    .eq('list_id', listId)
    .eq('tmdb_id', tmdbId);
  if (error) fail(error);
  if (count === 0) throw new ApiError('You can’t edit this list, or the movie was removed', 403);
}

export async function removeFromWatchlist(listId: string, tmdbId: number): Promise<void> {
  const { error, count } = await supabase
    .from('watchlist_items')
    .delete({ count: 'exact' })
    .eq('list_id', listId)
    .eq('tmdb_id', tmdbId);
  if (error) fail(error);
  if (count === 0) throw new ApiError('You can’t edit this list, or the movie was already removed', 403);
}

// ---------- Settings ----------

export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('region, my_services, theme, current_list')
    .maybeSingle();
  if (error) fail(error);
  if (!data) return DEFAULT_SETTINGS;
  const row = data as SettingsRow;
  return { region: row.region, myServices: row.my_services ?? [], theme: row.theme, currentListId: row.current_list };
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  const row: Partial<SettingsRow> & { user_id: string } = { user_id: await userId() };
  if (patch.region) row.region = patch.region;
  if (patch.myServices) row.my_services = patch.myServices;
  if (patch.theme) row.theme = patch.theme;
  if (patch.currentListId !== undefined) row.current_list = patch.currentListId;
  // Upsert so the first save creates the row.
  const { error } = await supabase.from('user_settings').upsert(row, { onConflict: 'user_id' });
  if (error) fail(error);
}

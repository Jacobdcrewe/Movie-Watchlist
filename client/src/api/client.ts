/**
 * The app's data API. Movie data comes straight from TMDB; your watchlist and
 * settings live in Supabase. Hooks only talk to this module.
 */
import type { Region } from '../../../shared/types';
import * as catalog from '../data/catalog';
import * as repo from '../data/repository';

export { ApiError } from '../data/errors';

export const api = {
  /** Empty query → trending titles. */
  search: (q: string, region: Region, signal?: AbortSignal) =>
    q.trim() ? catalog.search(q.trim(), region, signal) : catalog.trending(region, signal),
  movie: catalog.details,
  providers: catalog.providers,

  watchlist: repo.listWatchlist,
  add: repo.addToWatchlist,
  update: (id: number, patch: Parameters<typeof repo.updateWatchlist>[1], _region?: Region) => repo.updateWatchlist(id, patch),
  remove: repo.removeFromWatchlist,

  settings: repo.getSettings,
  saveSettings: repo.saveSettings,
};

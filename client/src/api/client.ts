/**
 * The app's data API. Movie data comes straight from TMDB; your lists, their
 * items and your settings live in Supabase. Hooks only talk to this module.
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
  trailer: catalog.trailer,

  lists: repo.ensureLists,
  createList: repo.createList,
  renameList: repo.renameList,
  deleteList: repo.deleteList,
  leaveList: repo.leaveList,
  people: repo.listPeople,
  share: repo.shareList,
  unshare: repo.unshareList,

  watchlist: repo.listWatchlist,
  add: repo.addToWatchlist,
  update: repo.updateWatchlist,
  remove: repo.removeFromWatchlist,

  settings: repo.getSettings,
  saveSettings: repo.saveSettings,
};

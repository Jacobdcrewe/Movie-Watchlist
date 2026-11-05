import { useCallback, useEffect, useRef, useState } from 'react';
import type { Region, SearchResult, WatchlistEntry, WatchlistPatch } from '../../../shared/types';
import { api } from '../api/client';

/**
 * Items on one list, loaded for the current region. Mutations are optimistic
 * and roll back if the request fails. Shared lists refresh when you come back
 * to the tab, so you see what others changed.
 */
export function useWatchlist(listId: string | null, region: Region, onError: (msg: string) => void) {
  const [entries, setEntries] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  useEffect(() => {
    if (!listId) return;
    let cancelled = false;
    const load = (quiet: boolean) => {
      if (!quiet) {
        setLoading(true);
        setEntries([]);
      }
      api
        .watchlist(listId, region)
        .then((list) => !cancelled && setEntries(list))
        .catch((e: Error) => !cancelled && !quiet && onError(e.message))
        .finally(() => !cancelled && setLoading(false));
    };
    load(false);

    const onVisible = () => document.visibilityState === 'visible' && load(true);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
    };
    // onError is stable (useCallback in useToast)
  }, [listId, region, onError]);

  const replace = (id: number, next: WatchlistEntry) =>
    setEntries((list) => list.map((e) => (e.movie.id === id ? next : e)));

  const add = useCallback(
    (result: SearchResult) => {
      if (!listId || entriesRef.current.some((e) => e.movie.id === result.id)) return;
      const { availability, ...movie } = result;
      const optimistic: WatchlistEntry = { movie, availability, addedAt: Date.now(), watched: false, rating: 0, note: '' };
      setEntries((list) => [optimistic, ...list]);
      api
        .add(listId, result.id, region)
        .then((saved) => replace(result.id, saved))
        .catch((e: Error) => {
          setEntries((list) => list.filter((x) => x.movie.id !== result.id));
          onError(`Couldn’t add “${result.title}”: ${e.message}`);
        });
    },
    [listId, region, onError],
  );

  const update = useCallback(
    (id: number, patch: WatchlistPatch) => {
      const before = entriesRef.current.find((e) => e.movie.id === id);
      if (!listId || !before) return;
      replace(id, { ...before, ...patch });
      api.update(listId, id, patch).catch((e: Error) => {
        replace(id, before);
        onError(`Couldn’t save: ${e.message}`);
      });
    },
    [listId, onError],
  );

  const remove = useCallback(
    (id: number) => {
      const index = entriesRef.current.findIndex((e) => e.movie.id === id);
      if (!listId || index < 0) return;
      const removed = entriesRef.current[index];
      setEntries((list) => list.filter((e) => e.movie.id !== id));
      api.remove(listId, id).catch((e: Error) => {
        setEntries((list) => [...list.slice(0, index), removed, ...list.slice(index)]);
        onError(`Couldn’t remove “${removed.movie.title}”: ${e.message}`);
      });
    },
    [listId, onError],
  );

  return { entries, loading, add, update, remove };
}

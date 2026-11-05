import { useCallback, useEffect, useRef, useState } from 'react';
import type { Region, SearchResult, WatchlistEntry, WatchlistPatch } from '../../../shared/types';
import { api } from '../api/client';

/**
 * The watchlist, loaded from the API for the current region.
 * All mutations are optimistic and roll back if the request fails.
 */
export function useWatchlist(region: Region, enabled: boolean, onError: (msg: string) => void) {
  const [entries, setEntries] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    api
      .watchlist(region)
      .then((list) => !cancelled && setEntries(list))
      .catch((e: Error) => !cancelled && onError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [region, enabled]);

  const replace = (id: number, next: WatchlistEntry) =>
    setEntries((list) => list.map((e) => (e.movie.id === id ? next : e)));

  const add = useCallback(
    (result: SearchResult) => {
      if (entriesRef.current.some((e) => e.movie.id === result.id)) return;
      const { availability, ...movie } = result;
      const optimistic: WatchlistEntry = { movie, availability, addedAt: Date.now(), watched: false, rating: 0, note: '' };
      setEntries((list) => [optimistic, ...list]);
      api
        .add(result.id, region)
        .then((saved) => replace(result.id, saved))
        .catch((e: Error) => {
          setEntries((list) => list.filter((x) => x.movie.id !== result.id));
          onError(`Couldn’t add “${result.title}”: ${e.message}`);
        });
    },
    [region, onError],
  );

  const update = useCallback(
    (id: number, patch: WatchlistPatch) => {
      const before = entriesRef.current.find((e) => e.movie.id === id);
      if (!before) return;
      replace(id, { ...before, ...patch });
      api.update(id, patch, region).catch((e: Error) => {
        replace(id, before);
        onError(`Couldn’t save: ${e.message}`);
      });
    },
    [region, onError],
  );

  const remove = useCallback(
    (id: number) => {
      const index = entriesRef.current.findIndex((e) => e.movie.id === id);
      if (index < 0) return;
      const removed = entriesRef.current[index];
      setEntries((list) => list.filter((e) => e.movie.id !== id));
      api.remove(id).catch((e: Error) => {
        setEntries((list) => [...list.slice(0, index), removed, ...list.slice(index)]);
        onError(`Couldn’t remove “${removed.movie.title}”: ${e.message}`);
      });
    },
    [onError],
  );

  return { entries, loading, add, update, remove };
}

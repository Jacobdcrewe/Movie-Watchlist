import { useCallback, useEffect, useState } from 'react';
import type { WatchList } from '../../../shared/types';
import { api } from '../api/client';

/**
 * Your lists (owned + shared with you) and which one is open.
 * The open list is remembered in settings so it follows you across devices.
 */
export function useLists(
  savedListId: string | null,
  settingsLoaded: boolean,
  saveCurrent: (id: string) => void,
  onError: (msg: string) => void,
) {
  const [lists, setLists] = useState<WatchList[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const next = await api.lists();
    setLists(next);
    // Keep the current list if it still exists (it may have been deleted or unshared).
    setCurrentId((cur) => (cur && next.some((l) => l.id === cur) ? cur : (next[0]?.id ?? null)));
    return next;
  }, []);

  // Initial load once settings are known, so we can reopen the last list.
  useEffect(() => {
    if (!settingsLoaded) return;
    let cancelled = false;
    api
      .lists()
      .then((next) => {
        if (cancelled) return;
        setLists(next);
        const saved = next.find((l) => l.id === savedListId);
        setCurrentId(saved?.id ?? next[0]?.id ?? null);
      })
      .catch((e: Error) => !cancelled && onError(e.message))
      .finally(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
    // Only on first settings load — later settings changes come from us.
  }, [settingsLoaded]);

  // Pick up lists newly shared with you when you return to the tab.
  useEffect(() => {
    if (!loaded) return;
    const onVisible = () => document.visibilityState === 'visible' && refresh().catch(() => {});
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loaded, refresh]);

  const select = useCallback(
    (id: string) => {
      setCurrentId(id);
      saveCurrent(id);
    },
    [saveCurrent],
  );

  const create = useCallback(
    async (name: string) => {
      const list = await api.createList(name);
      await refresh();
      select(list.id);
    },
    [refresh, select],
  );

  const rename = useCallback(
    async (id: string, name: string) => {
      await api.renameList(id, name);
      await refresh();
    },
    [refresh],
  );

  /** Delete (owner) or leave (shared with you); then open another list. */
  const removeOrLeave = useCallback(
    async (list: WatchList) => {
      if (list.role === 'owner') await api.deleteList(list.id);
      else await api.leaveList(list.id);
      const next = await refresh();
      const fallback = next[0]?.id;
      if (fallback) select(fallback);
    },
    [refresh, select],
  );

  const current = lists.find((l) => l.id === currentId) ?? null;
  return { lists, current, loaded, select, create, rename, removeOrLeave, refresh };
}

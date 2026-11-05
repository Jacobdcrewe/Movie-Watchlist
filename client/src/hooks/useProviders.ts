import { useEffect, useMemo, useState } from 'react';
import type { Provider, Region, WatchlistEntry } from '../../../shared/types';
import { api } from '../api/client';

const TOP_N = 8;

/**
 * Services shown as "My services" chips: the region's most popular providers,
 * plus anything you've selected or that streams something on your list.
 */
export function useProviders(region: Region, myServices: number[], entries: WatchlistEntry[]) {
  const [all, setAll] = useState<Provider[]>([]);

  useEffect(() => {
    let cancelled = false;
    api
      .providers(region)
      .then((p) => !cancelled && setAll(p))
      .catch(() => !cancelled && setAll([]));
    return () => {
      cancelled = true;
    };
  }, [region]);

  return useMemo(() => {
    const onList = new Map<number, Provider>();
    for (const e of entries) for (const p of e.availability.stream) onList.set(p.id, p);

    const chosen: Provider[] = [];
    const seen = new Set<number>();
    const push = (p?: Provider) => {
      if (p && !seen.has(p.id)) {
        seen.add(p.id);
        chosen.push(p);
      }
    };
    all.slice(0, TOP_N).forEach(push);
    myServices.forEach((id) => push(all.find((p) => p.id === id) ?? onList.get(id)));
    // Popular-order the rest that appear on the list, capped so the row stays tidy.
    all.filter((p) => onList.has(p.id)).slice(0, 4).forEach(push);
    if (!all.length) onList.forEach((p) => push(p));
    return chosen;
  }, [all, myServices, entries]);
}

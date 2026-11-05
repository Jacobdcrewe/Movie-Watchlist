import { useEffect, useState } from 'react';
import type { Region, SearchResult } from '../../../shared/types';
import { api } from '../api/client';

/** Debounced movie search; an empty query returns trending titles. */
export function useSearch(query: string, region: Region, active: boolean, delay = 250) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settledQuery, setSettledQuery] = useState('');

  useEffect(() => {
    if (!active) return;
    const q = query.trim();
    const ctrl = new AbortController();
    setLoading(true);
    const timer = setTimeout(
      () => {
        api
          .search(q, region, ctrl.signal)
          .then((r) => {
            setResults(r);
            setError(null);
            setSettledQuery(q);
          })
          .catch((e: Error) => {
            if (e.name === 'AbortError') return;
            setResults([]);
            setError(e.message);
            setSettledQuery(q);
          })
          .finally(() => !ctrl.signal.aborted && setLoading(false));
      },
      q ? delay : 0,
    );
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query, region, active, delay]);

  return { results, loading, error, settledQuery };
}

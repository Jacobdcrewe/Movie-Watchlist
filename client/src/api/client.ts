import type {
  Availability,
  Movie,
  Provider,
  Region,
  SearchResult,
  Settings,
  WatchlistEntry,
  WatchlistPatch,
} from '../../../shared/types';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: init.body ? { 'content-type': 'application/json', ...init.headers } : init.headers,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      message = ((await res.json()) as { error?: string }).error ?? message;
    } catch {
      /* non-JSON error */
    }
    throw new ApiError(message, res.status);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

const json = (body: unknown) => JSON.stringify(body);

export const api = {
  search: (q: string, region: Region, signal?: AbortSignal) =>
    request<SearchResult[]>(`/search?region=${region}&q=${encodeURIComponent(q)}`, { signal }),
  movie: (id: number, region: Region) =>
    request<{ movie: Movie; availability: Availability }>(`/movies/${id}?region=${region}`),
  providers: (region: Region) => request<Provider[]>(`/providers?region=${region}`),

  watchlist: (region: Region) => request<WatchlistEntry[]>(`/watchlist?region=${region}`),
  add: (tmdbId: number, region: Region) =>
    request<WatchlistEntry>(`/watchlist?region=${region}`, { method: 'POST', body: json({ tmdbId }) }),
  update: (id: number, patch: WatchlistPatch, region: Region) =>
    request<WatchlistEntry>(`/watchlist/${id}?region=${region}`, { method: 'PATCH', body: json(patch) }),
  remove: (id: number) => request<void>(`/watchlist/${id}`, { method: 'DELETE' }),

  settings: () => request<Settings>('/settings'),
  saveSettings: (patch: Partial<Settings>) => request<Settings>('/settings', { method: 'PUT', body: json(patch) }),
};

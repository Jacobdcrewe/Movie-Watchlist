import { ApiError } from './errors';

const BASE_URL = 'https://api.themoviedb.org/3';
const TOKEN = ((import.meta.env.VITE_TMDB_READ_TOKEN || import.meta.env.TMDB_READ_TOKEN) as string | undefined)?.trim() ?? '';

export const tmdbConfigured = TOKEN.length > 0;

type Params = Record<string, string | number | boolean | undefined>;

const cache = new Map<string, { expires: number; value: Promise<unknown> }>();

/**
 * GET from TMDB with the read-access token, de-duplicating identical
 * requests and caching responses in memory for `ttlMs`.
 */
export function tmdbGet<T>(endpoint: string, params: Params = {}, ttlMs = 10 * 60 * 1000, signal?: AbortSignal): Promise<T> {
  if (!tmdbConfigured) {
    return Promise.reject(new ApiError('TMDB token missing. Set VITE_TMDB_READ_TOKEN.', 503));
  }
  const url = new URL(BASE_URL + endpoint);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  }
  const key = url.toString();
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expires > now) return hit.value as Promise<T>;

  const value = request<T>(url, signal);
  cache.set(key, { expires: now + ttlMs, value });
  value.catch(() => cache.delete(key));
  return value;
}

async function request<T>(url: URL, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { headers: { accept: 'application/json', authorization: `Bearer ${TOKEN}` }, signal });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new ApiError('Could not reach TMDB. Check your connection.', 0);
  }
  if (!res.ok) {
    let message = `TMDB request failed (${res.status})`;
    try {
      const body = (await res.json()) as { status_message?: string };
      if (body.status_message) message = `TMDB: ${body.status_message}`;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }
  return (await res.json()) as T;
}

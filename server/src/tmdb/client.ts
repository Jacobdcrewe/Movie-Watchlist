const DEFAULT_BASE_URL = 'https://api.themoviedb.org/3';

export class TmdbError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'TmdbError';
  }
}

export interface TmdbClientOptions {
  readToken?: string;
  apiKey?: string;
  /** Override the API root (e.g. a local mock). */
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  /** Default TTL for cached GET responses (ms). */
  cacheTtlMs?: number;
}

type Params = Record<string, string | number | boolean | undefined>;

/**
 * Minimal TMDB v3 client: authentication, error handling and an in-memory
 * TTL cache so repeated searches / provider lookups don't hit the API.
 */
export class TmdbClient {
  private cache = new Map<string, { expires: number; value: Promise<unknown> }>();
  private fetchImpl: typeof fetch;
  private ttl: number;

  constructor(private opts: TmdbClientOptions) {
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.ttl = opts.cacheTtlMs ?? 10 * 60 * 1000;
  }

  get configured(): boolean {
    return Boolean(this.opts.readToken || this.opts.apiKey);
  }

  async get<T>(endpoint: string, params: Params = {}, ttlMs = this.ttl): Promise<T> {
    if (!this.configured) {
      throw new TmdbError('TMDB credentials missing. Set TMDB_READ_TOKEN or TMDB_API_KEY in .env', 503);
    }
    const url = new URL((this.opts.baseUrl || DEFAULT_BASE_URL) + endpoint);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
    }
    if (!this.opts.readToken && this.opts.apiKey) url.searchParams.set('api_key', this.opts.apiKey);

    const key = url.toString();
    const now = Date.now();
    const hit = this.cache.get(key);
    if (hit && hit.expires > now) return hit.value as Promise<T>;

    const value = this.request<T>(url);
    this.cache.set(key, { expires: now + ttlMs, value });
    // Don't keep failures around.
    value.catch(() => this.cache.delete(key));
    if (this.cache.size > 2000) this.prune(now);
    return value;
  }

  private async request<T>(url: URL): Promise<T> {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (this.opts.readToken) headers.authorization = `Bearer ${this.opts.readToken}`;
    let res: Response;
    try {
      res = await this.fetchImpl(url, { headers });
    } catch (err) {
      throw new TmdbError(`Could not reach TMDB: ${(err as Error).message}`, 502);
    }
    if (!res.ok) {
      let message = `TMDB request failed (${res.status})`;
      try {
        const body = (await res.json()) as { status_message?: string };
        if (body.status_message) message = `TMDB: ${body.status_message}`;
      } catch {
        /* ignore */
      }
      throw new TmdbError(message, res.status === 404 ? 404 : 502);
    }
    return (await res.json()) as T;
  }

  private prune(now: number) {
    for (const [k, v] of this.cache) if (v.expires <= now) this.cache.delete(k);
  }
}

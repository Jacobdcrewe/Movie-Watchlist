import type { Provider } from '../../../shared/types';

/**
 * "Watch on …" links. TMDB doesn't give per-service deep links, so for the
 * common services we open the movie's search page on that service; anything
 * else falls back to the TMDB / JustWatch watch page for the region.
 * Matching is by name, so variants like "Netflix Standard with Ads" still work.
 */
const SEARCH: { match: RegExp; url: (q: string) => string }[] = [
  { match: /netflix/i, url: (q) => `https://www.netflix.com/search?q=${q}` },
  { match: /crave/i, url: (q) => `https://www.crave.ca/en/search?q=${q}` },
  { match: /amazon|prime video/i, url: (q) => `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${q}` },
  { match: /disney/i, url: (q) => `https://www.disneyplus.com/search?q=${q}` },
  { match: /apple tv/i, url: (q) => `https://tv.apple.com/search?term=${q}` },
  { match: /tubi/i, url: (q) => `https://tubitv.com/search/${q}` },
  { match: /cbc gem/i, url: (q) => `https://gem.cbc.ca/search?q=${q}` },
  { match: /hulu/i, url: (q) => `https://www.hulu.com/search?q=${q}` },
  { match: /google play/i, url: (q) => `https://play.google.com/store/search?q=${q}&c=movies` },
  { match: /youtube/i, url: (q) => `https://www.youtube.com/results?search_query=${q}` },
];

/** Where to send the user to watch `title` on `provider`, or null if we have nowhere. */
export function watchUrl(provider: Provider, title: string, fallback: string | null): string | null {
  const hit = SEARCH.find((s) => s.match.test(provider.name));
  return hit ? hit.url(encodeURIComponent(title)) : fallback;
}

/** The service to feature: the first one you subscribe to, else the first that streams it. */
export function bestStream(stream: Provider[], myServices: number[]): Provider | null {
  return stream.find((p) => myServices.includes(p.id)) ?? stream[0] ?? null;
}

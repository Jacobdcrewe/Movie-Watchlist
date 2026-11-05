const IMG = 'https://image.tmdb.org/t/p';

export type PosterSize = 'w92' | 'w185' | 'w342' | 'w500';
export type BackdropSize = 'w780' | 'w1280';

export const posterUrl = (path: string | null, size: PosterSize = 'w342') => (path ? `${IMG}/${size}${path}` : null);
export const backdropUrl = (path: string | null, size: BackdropSize = 'w780') => (path ? `${IMG}/${size}${path}` : null);
export const logoUrl = (path: string | null) => (path ? `${IMG}/w92${path}` : null);

/** Stable hue (0–359) derived from a movie id, for placeholder art. */
export const hueFor = (id: number) => (id * 47) % 360;

/** The striped gradient used when TMDB has no artwork (same recipe as the design). */
export const placeholderArt = (id: number) => {
  const h = hueFor(id);
  return `repeating-linear-gradient(135deg, rgba(255,255,255,.06) 0 2px, transparent 2px 10px), linear-gradient(160deg, oklch(0.62 0.13 ${h}), oklch(0.28 0.08 ${(h + 50) % 360}))`;
};

/** CSS background with the real image layered over the placeholder. */
export const artBackground = (id: number, url: string | null) =>
  url ? `center / cover no-repeat url("${url}"), ${placeholderArt(id)}` : placeholderArt(id);

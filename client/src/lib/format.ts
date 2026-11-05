/** 166 → "2h 46m" */
export const runtime = (min: number | null | undefined) => {
  if (!min) return '';
  const h = Math.floor(min / 60);
  return h ? `${h}h ${min % 60}m` : `${min}m`;
};

/** Join non-empty parts with a middle dot. */
export const dotJoin = (...parts: (string | number | null | undefined | false)[]) =>
  parts.filter((p) => p !== null && p !== undefined && p !== false && p !== '').join(' · ');

export const stars = (rating: number) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

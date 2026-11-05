import { Star } from 'lucide-react';
import styles from './ui.module.css';

/** Read-only row of five stars, `value` of them filled. */
export function Stars({ value, size = 14, color = 'var(--accent)' }: { value: number; size?: number; color?: string }) {
  return (
    <span className={styles.stars} role="img" aria-label={value ? `${value} out of 5 stars` : 'Not rated'}>
      {[1, 2, 3, 4, 5].map((k) => (
        <Star
          key={k}
          size={size}
          strokeWidth={1.8}
          color={k <= value ? color : 'var(--faint)'}
          fill={k <= value ? color : 'none'}
          aria-hidden
        />
      ))}
    </span>
  );
}

/** Small star + number, e.g. the critics' score. */
export function Score({ value, size = 12 }: { value: number; size?: number }) {
  return (
    <span className={styles.score}>
      <Star size={size} strokeWidth={2} fill="currentColor" aria-hidden />
      {value || '—'}
    </span>
  );
}

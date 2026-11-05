import { Star } from 'lucide-react';
import styles from './Detail.module.css';

/** 5 stars; clicking the current rating clears it. */
export function StarRating({
  value,
  onChange,
  readOnly = false,
}: {
  value: number;
  onChange: (v: number) => void;
  readOnly?: boolean;
}) {
  return (
    <div className={styles.stars} role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((k) => (
        <button
          key={k}
          type="button"
          role="radio"
          aria-checked={value === k}
          aria-label={`${k} star${k > 1 ? 's' : ''}`}
          className={styles.star}
          disabled={readOnly}
          onClick={() => onChange(value === k ? 0 : k)}
        >
          <Star
            size={22}
            strokeWidth={1.7}
            color={k <= value ? 'var(--accent)' : 'var(--faint)'}
            fill={k <= value ? 'var(--accent)' : 'none'}
            aria-hidden
          />
        </button>
      ))}
    </div>
  );
}

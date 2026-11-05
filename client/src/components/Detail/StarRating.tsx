import styles from './Detail.module.css';

/** 5 stars; clicking the current rating clears it. */
export function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
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
          style={{ color: k <= value ? 'var(--accent)' : 'var(--field-line)' }}
          onClick={() => onChange(value === k ? 0 : k)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

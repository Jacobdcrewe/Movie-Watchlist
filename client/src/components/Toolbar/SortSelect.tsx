import { SORTS, type SortKey } from '../../lib/watchlist';
import styles from './Toolbar.module.css';

export function SortSelect({ value, onChange }: { value: SortKey; onChange: (k: SortKey) => void }) {
  return (
    <label className={`glass ${styles.sort}`}>
      <span className="mono-label" style={{ letterSpacing: 0 }}>
        SORT
      </span>
      <select className={styles.select} value={value} onChange={(e) => onChange(e.target.value as SortKey)}>
        {SORTS.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>
    </label>
  );
}

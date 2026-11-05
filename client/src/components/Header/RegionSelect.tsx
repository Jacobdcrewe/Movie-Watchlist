import { REGIONS, type Region } from '../../../../shared/types';
import styles from './Header.module.css';

export function RegionSelect({ value, onChange }: { value: Region; onChange: (r: Region) => void }) {
  return (
    <label className={styles.region}>
      <span className="mono-label" style={{ letterSpacing: 0 }}>
        IN
      </span>
      <select
        className={styles.select}
        value={value}
        aria-label="Region"
        onChange={(e) => onChange(e.target.value as Region)}
      >
        {(Object.keys(REGIONS) as Region[]).map((r) => (
          <option key={r} value={r}>
            {REGIONS[r]}
          </option>
        ))}
      </select>
    </label>
  );
}

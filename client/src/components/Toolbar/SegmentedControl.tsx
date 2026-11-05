import type { ReactNode } from 'react';
import styles from './Toolbar.module.css';

export interface Segment<K extends string> {
  key: K;
  label: string;
  count?: number;
  icon?: ReactNode;
}

interface Props<K extends string> {
  segments: Segment<K>[];
  value: K;
  onChange: (k: K) => void;
  label: string;
}

export function SegmentedControl<K extends string>({ segments, value, onChange, label }: Props<K>) {
  return (
    <div className={`glass ${styles.segmented}`} role="tablist" aria-label={label}>
      {segments.map((s) => (
        <button
          key={s.key}
          type="button"
          role="tab"
          aria-selected={s.key === value}
          className={`${styles.segment} ${s.key === value ? styles.active : ''}`}
          onClick={() => onChange(s.key)}
        >
          {s.icon}
          {s.label}
          {s.count !== undefined && <span className={styles.count}>{s.count}</span>}
        </button>
      ))}
    </div>
  );
}

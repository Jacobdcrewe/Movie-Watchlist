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
  /** Hide text labels on narrow screens and show icons only (labels stay as accessible names). */
  iconOnlyNarrow?: boolean;
  className?: string;
}

export function SegmentedControl<K extends string>({ segments, value, onChange, label, iconOnlyNarrow, className = '' }: Props<K>) {
  return (
    <div className={`glass ${styles.segmented} ${className}`} role="tablist" aria-label={label}>
      {segments.map((s) => (
        <button
          key={s.key}
          type="button"
          role="tab"
          aria-selected={s.key === value}
          className={`${styles.segment} ${s.key === value ? styles.active : ''}`}
          onClick={() => onChange(s.key)}
          aria-label={iconOnlyNarrow ? s.label : undefined}
          title={iconOnlyNarrow ? s.label : undefined}
        >
          {s.icon}
          <span className={iconOnlyNarrow ? styles.collapsible : undefined}>{s.label}</span>
          {s.count !== undefined && <span className={styles.count}>{s.count}</span>}
        </button>
      ))}
    </div>
  );
}

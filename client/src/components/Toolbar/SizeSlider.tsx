import type { CSSProperties } from 'react';
import styles from './Toolbar.module.css';

export const SCALE_MIN = 0.7;
export const SCALE_MAX = 1.5;
export const SCALE_DEFAULT = 1;

/** Parse a stored scale value, clamping to the allowed range. */
export function parseScale(raw: string | null | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return SCALE_DEFAULT;
  return Math.min(SCALE_MAX, Math.max(SCALE_MIN, n));
}

interface Props {
  value: number;
  onChange: (v: number) => void;
}

/** Zoom-style slider controlling the size of grid cards and list rows. */
export function SizeSlider({ value, onChange }: Props) {
  const pct = Math.round(value * 100);
  const fill = ((value - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100;

  return (
    <div className={`glass ${styles.size}`} title={`Card size ${pct}% · double-click to reset`}>
      <span className={styles.sizeIcon} style={{ width: 9, height: 9 }} aria-hidden />
      <input
        type="range"
        className={styles.range}
        min={SCALE_MIN}
        max={SCALE_MAX}
        step={0.05}
        value={value}
        aria-label="Card size"
        aria-valuetext={`${pct}%`}
        style={{ '--fill': `${fill}%` } as CSSProperties}
        onChange={(e) => onChange(parseScale(e.target.value))}
        onDoubleClick={() => onChange(SCALE_DEFAULT)}
      />
      <span className={styles.sizeIcon} style={{ width: 14, height: 14 }} aria-hidden />
    </div>
  );
}

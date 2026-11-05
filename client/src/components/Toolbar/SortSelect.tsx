import { ArrowDownAZ, CalendarDays, Clock, Star, Timer } from 'lucide-react';
import type { ReactNode } from 'react';
import { SORTS, type SortKey } from '../../lib/watchlist';
import { Dropdown } from '../ui/Dropdown';
import styles from './Toolbar.module.css';

const ICON = { size: 15, strokeWidth: 1.9, 'aria-hidden': true } as const;
const SORT_ICONS: Record<SortKey, ReactNode> = {
  added: <Clock {...ICON} />,
  rating: <Star {...ICON} />,
  runtime: <Timer {...ICON} />,
  year: <CalendarDays {...ICON} />,
  title: <ArrowDownAZ {...ICON} />,
};

const OPTIONS = SORTS.map((s) => ({ value: s.key, label: s.label, icon: SORT_ICONS[s.key] }));

export function SortSelect({ value, onChange }: { value: SortKey; onChange: (k: SortKey) => void }) {
  return (
    <Dropdown
      label="Sort"
      variant="glass"
      value={value}
      options={OPTIONS}
      onChange={onChange}
      leading={
        <span className={`mono-label ${styles.collapsible}`} style={{ letterSpacing: 0 }}>
          SORT
        </span>
      }
    />
  );
}

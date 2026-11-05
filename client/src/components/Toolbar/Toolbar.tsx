import type { ReactNode } from 'react';
import { TABS, type SortKey, type Tab, type ViewMode } from '../../lib/watchlist';
import { SegmentedControl } from './SegmentedControl';
import { SizeSlider } from './SizeSlider';
import { SortSelect } from './SortSelect';
import styles from './Toolbar.module.css';

interface Props {
  /** Page title (the list switcher). */
  title: ReactNode;
  summary: string;
  tab: Tab;
  counts: Record<Tab, number>;
  onTab: (t: Tab) => void;
  sort: SortKey;
  onSort: (s: SortKey) => void;
  view: ViewMode;
  onView: (v: ViewMode) => void;
  scale: number;
  onScale: (s: number) => void;
}

const VIEWS: { key: ViewMode; label: string }[] = [
  { key: 'grid', label: 'Grid' },
  { key: 'list', label: 'List' },
  { key: 'text', label: 'Text' },
];

export function Toolbar({ title, summary, tab, counts, onTab, sort, onSort, view, onView, scale, onScale }: Props) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.titleBlock}>
        {title}
        <div className={styles.summary}>{summary}</div>
      </div>
      <div className={styles.controls}>
        <SegmentedControl
          label="Filter by status"
          segments={TABS.map((t) => ({ ...t, count: counts[t.key] }))}
          value={tab}
          onChange={onTab}
        />
        <SortSelect value={sort} onChange={onSort} />
        <SegmentedControl label="View" segments={VIEWS} value={view} onChange={onView} />
        <SizeSlider value={scale} onChange={onScale} />
      </div>
    </div>
  );
}

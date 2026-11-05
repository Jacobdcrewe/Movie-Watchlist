import { TABS, type SortKey, type Tab, type ViewMode } from '../../lib/watchlist';
import { SegmentedControl } from './SegmentedControl';
import { SortSelect } from './SortSelect';
import styles from './Toolbar.module.css';

interface Props {
  summary: string;
  tab: Tab;
  counts: Record<Tab, number>;
  onTab: (t: Tab) => void;
  sort: SortKey;
  onSort: (s: SortKey) => void;
  view: ViewMode;
  onView: (v: ViewMode) => void;
}

const VIEWS: { key: ViewMode; label: string }[] = [
  { key: 'grid', label: 'Grid' },
  { key: 'list', label: 'List' },
];

export function Toolbar({ summary, tab, counts, onTab, sort, onSort, view, onView }: Props) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>Watchlist</h1>
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
      </div>
    </div>
  );
}

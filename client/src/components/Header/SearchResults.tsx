import type { SearchResult } from '../../../../shared/types';
import { artBackground, posterUrl } from '../../lib/images';
import styles from './SearchBox.module.css';

interface Props {
  heading: string;
  results: SearchResult[];
  inList: Set<number>;
  onAdd: (r: SearchResult) => void;
  error: string | null;
  emptyText: string;
  regionName: string;
}

export function availabilitySummary(r: SearchResult, regionName: string) {
  const { stream, rent, buy } = r.availability;
  const names = (list: { name: string }[]) =>
    list
      .slice(0, 3)
      .map((p) => p.name)
      .join(', ');
  if (stream.length) return `Stream on ${names(stream)}`;
  if (rent.length) return `Rent on ${names(rent)}`;
  if (buy.length) return `Buy on ${names(buy)}`;
  return `Not available in ${regionName}`;
}

export function SearchResults({ heading, results, inList, onAdd, error, emptyText, regionName }: Props) {
  return (
    <div className={styles.dropdown} role="listbox">
      {heading && !error && <div className={`mono-label ${styles.heading}`}>{heading}</div>}
      {results.map((r) => {
        const added = inList.has(r.id);
        return (
          <div
            key={r.id}
            role="option"
            aria-selected={false}
            className={styles.result}
            // mouse-down fires before the input's blur closes the dropdown
            onMouseDown={(e) => {
              e.preventDefault();
              onAdd(r);
            }}
          >
            <div className={styles.thumb} style={{ background: artBackground(r.id, posterUrl(r.posterPath, 'w92')) }} />
            <div className={styles.resultText}>
              <div className={styles.resultTitle}>
                {r.title} {r.year && <span className={styles.resultYear}>{r.year}</span>}
              </div>
              <div className={styles.resultAvail}>{availabilitySummary(r, regionName)}</div>
            </div>
            <span className={`${styles.addBtn} ${added ? styles.added : ''}`}>{added ? 'Added ✓' : '+ Add'}</span>
          </div>
        );
      })}
      {emptyText && <div className={styles.message}>{emptyText}</div>}
      {error && <div className={styles.message}>{error}</div>}
    </div>
  );
}

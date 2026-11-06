import type { CSSProperties } from 'react';
import type { WatchlistEntry } from '../../../../shared/types';
import type { ViewMode } from '../../lib/watchlist';
import { MovieCard } from './MovieCard';
import { MovieRow } from './MovieRow';
import { MovieTable } from './MovieTable';
import type { MovieActions } from './types';
import styles from './Movies.module.css';

interface Props extends MovieActions {
  entries: WatchlistEntry[];
  view: ViewMode;
  /** Size multiplier from the toolbar slider (1 = default). */
  scale: number;
  wide: boolean;
}

const scaleVar = (scale: number) => ({ '--scale': scale }) as CSSProperties;

/** Grid of poster cards, a list of rows, or a compact text table. */
export function MovieCollection({ entries, view, scale, wide, ...actions }: Props) {
  if (view === 'grid') {
    return (
      <div className={styles.grid} style={scaleVar(scale)}>
        {entries.map((e) => (
          <MovieCard key={e.movie.id} entry={e} {...actions} />
        ))}
      </div>
    );
  }
  if (view === 'text') {
    return (
      <div style={scaleVar(scale)}>
        <MovieTable entries={entries} {...actions} />
      </div>
    );
  }
  return (
    <div className={styles.list} style={scaleVar(scale)}>
      {entries.map((e) => (
        <MovieRow key={e.movie.id} entry={e} showRating={wide} {...actions} />
      ))}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyTitle}>{title}</div>
      <div className={styles.emptyBody}>{body}</div>
    </div>
  );
}

export function LoadingGrid({ scale }: { scale: number }) {
  return (
    <div className={styles.grid} style={scaleVar(scale)} aria-busy>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className={`glass ${styles.card} ${styles.skeleton}`}>
          <div className={styles.poster} />
          <div className={styles.cardOverlay}>
            <div className={styles.skelLine} />
            <div className={styles.skelLine} style={{ width: '50%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

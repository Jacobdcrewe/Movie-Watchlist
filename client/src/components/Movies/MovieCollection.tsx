import type { WatchlistEntry } from '../../../../shared/types';
import type { ViewMode } from '../../lib/watchlist';
import { MovieCard } from './MovieCard';
import { MovieRow } from './MovieRow';
import type { MovieActions } from './types';
import styles from './Movies.module.css';

interface Props extends MovieActions {
  entries: WatchlistEntry[];
  view: ViewMode;
  wide: boolean;
}

/** Grid of poster cards or a list of rows. */
export function MovieCollection({ entries, view, wide, ...actions }: Props) {
  if (view === 'grid') {
    return (
      <div className={styles.grid}>
        {entries.map((e) => (
          <MovieCard key={e.movie.id} entry={e} {...actions} />
        ))}
      </div>
    );
  }
  return (
    <div className={styles.list}>
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

export function LoadingGrid() {
  return (
    <div className={styles.grid} aria-busy>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className={`glass ${styles.card} ${styles.skeleton}`}>
          <div className={styles.poster} />
          <div className={styles.skelLine} />
          <div className={styles.skelLine} style={{ width: '50%' }} />
        </div>
      ))}
    </div>
  );
}

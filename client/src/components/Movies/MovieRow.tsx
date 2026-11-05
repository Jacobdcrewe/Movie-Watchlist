import type { WatchlistEntry } from '../../../../shared/types';
import { dotJoin, runtime, stars } from '../../lib/format';
import { AvailabilityBadges } from './AvailabilityBadges';
import { Poster } from './Poster';
import type { MovieActions } from './types';
import styles from './Movies.module.css';

export function MovieRow({
  entry,
  myServices,
  onOpen,
  onToggleWatched,
  onRemove,
  showRating,
}: { entry: WatchlistEntry; showRating: boolean } & MovieActions) {
  const { movie, watched, rating } = entry;
  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  return (
    <article
      className={`glass ${styles.row}`}
      tabIndex={0}
      onClick={() => onOpen(movie.id)}
      onKeyDown={(e) => e.key === 'Enter' && e.target === e.currentTarget && onOpen(movie.id)}
      aria-label={movie.title}
    >
      <Poster id={movie.id} path={movie.posterPath} size="w185" dim={watched} className={styles.rowThumb} />
      <div className={styles.rowBody}>
        <div className={styles.rowHead}>
          <span className={styles.rowTitle}>{movie.title}</span>
          {watched && <span className={styles.outlinePill}>Watched</span>}
        </div>
        <div className={styles.rowMeta}>
          {dotJoin(movie.year, runtime(movie.runtime), movie.genres.join(', '), movie.score ? `★ ${movie.score}` : '')}
        </div>
        <div className={styles.rowBadges}>
          <AvailabilityBadges availability={entry.availability} myServices={myServices} />
        </div>
      </div>
      {showRating && (
        <div className={styles.rowRating}>
          <span className={styles.stars} style={{ color: rating ? 'var(--accent)' : 'var(--faint)' }}>
            {stars(rating)}
          </span>
          <span className="mono-label" style={{ letterSpacing: 0 }}>
            {rating ? 'YOUR RATING' : 'NOT RATED'}
          </span>
        </div>
      )}
      <div className={styles.rowButtons}>
        <button
          type="button"
          className={`${styles.listBtn} ${watched ? styles.listBtnOn : ''}`}
          title={watched ? 'Mark unwatched' : 'Mark watched'}
          aria-pressed={watched}
          onClick={stop(() => onToggleWatched(movie.id, !watched))}
        >
          ✓
        </button>
        <button type="button" className={`${styles.listBtn} ${styles.listRemove}`} title="Remove" onClick={stop(() => onRemove(movie.id))}>
          ×
        </button>
      </div>
    </article>
  );
}

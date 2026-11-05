import type { WatchlistEntry } from '../../../../shared/types';
import { dotJoin, runtime } from '../../lib/format';
import { AvailabilityBadges } from './AvailabilityBadges';
import { Poster } from './Poster';
import type { MovieActions } from './types';
import styles from './Movies.module.css';

export function MovieCard({ entry, myServices, onOpen, onToggleWatched, onRemove }: { entry: WatchlistEntry } & MovieActions) {
  const { movie, watched } = entry;
  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  return (
    <article
      className={`glass ${styles.card}`}
      tabIndex={0}
      onClick={() => onOpen(movie.id)}
      onKeyDown={(e) => e.key === 'Enter' && e.target === e.currentTarget && onOpen(movie.id)}
      aria-label={movie.title}
    >
      <Poster id={movie.id} path={movie.posterPath} dim={watched} className={styles.cardPoster}>
        <div className={styles.cardButtons}>
          <button
            type="button"
            className={`${styles.roundBtn} ${watched ? styles.roundBtnOn : ''}`}
            title={watched ? 'Mark unwatched' : 'Mark watched'}
            aria-pressed={watched}
            onClick={stop(() => onToggleWatched(movie.id, !watched))}
          >
            ✓
          </button>
          <button type="button" className={`${styles.roundBtn} ${styles.removeBtn}`} title="Remove" onClick={stop(() => onRemove(movie.id))}>
            ×
          </button>
        </div>
        {watched && <span className={styles.watchedPill}>Watched</span>}
      </Poster>
      <div className={styles.cardText}>
        <div className={styles.cardTitle}>{movie.title}</div>
        <div className={styles.cardMeta}>{dotJoin(movie.year, runtime(movie.runtime), movie.score ? `★ ${movie.score}` : '')}</div>
      </div>
      <div className={styles.cardBadges}>
        <AvailabilityBadges availability={entry.availability} myServices={myServices} compact />
      </div>
    </article>
  );
}

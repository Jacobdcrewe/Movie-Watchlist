import { Check, X } from 'lucide-react';
import type { WatchlistEntry } from '../../../../shared/types';
import { dotJoin, runtime } from '../../lib/format';
import { AvailabilityBadges } from './AvailabilityBadges';
import { Poster } from './Poster';
import type { MovieActions } from './types';
import styles from './Movies.module.css';

export function MovieCard({ entry, myServices, onOpen, onToggleWatched, onRemove, readOnly }: { entry: WatchlistEntry } & MovieActions) {
  const { movie, watched } = entry;
  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  // Track the pointer so the holographic sheen and tilt follow it (CSS vars, no re-render).
  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
    el.style.setProperty('--rx', `${((0.5 - y) * 3).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${((x - 0.5) * 3).toFixed(2)}deg`);
  };
  const onLeave = (e: React.MouseEvent<HTMLElement>) => {
    const s = e.currentTarget.style;
    ['--mx', '--my', '--rx', '--ry'].forEach((v) => s.removeProperty(v));
  };

  return (
    <article
      className={`glass ${styles.card}`}
      tabIndex={0}
      onClick={() => onOpen(movie.id)}
      onKeyDown={(e) => e.key === 'Enter' && e.target === e.currentTarget && onOpen(movie.id)}
      aria-label={movie.title}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <Poster id={movie.id} path={movie.posterPath} dim={watched} className={styles.cardPoster}>
        {!readOnly && (
        <div className={styles.cardButtons}>
          <button
            type="button"
            className={`${styles.roundBtn} ${watched ? styles.roundBtnOn : ''}`}
            title={watched ? 'Mark unwatched' : 'Mark watched'}
            aria-pressed={watched}
            onClick={stop(() => onToggleWatched(movie.id, !watched))}
          >
            <Check size={16} strokeWidth={2.5} aria-hidden />
          </button>
          <button type="button" className={`${styles.roundBtn} ${styles.removeBtn}`} title="Remove" onClick={stop(() => onRemove(movie.id))}>
            <X size={16} strokeWidth={2.3} aria-hidden />
          </button>
        </div>
        )}
        {watched && <span className={styles.watchedPill}>Watched</span>}
      </Poster>
      {/* Prism light: a fixed specular sheen plus an iridescent shimmer that follows the pointer. */}
      <span className={styles.holo} aria-hidden />
      {/* Title, details and services on a floating frosted-glass plate. */}
      <div className={`prism-edge ${styles.cardOverlay}`}>
        <div className={styles.cardText}>
          <div className={styles.cardTitle}>{movie.title}</div>
          <div className={styles.cardMeta}>{dotJoin(movie.year, runtime(movie.runtime), movie.score ? `★ ${movie.score}` : '')}</div>
        </div>
        <div className={styles.cardBadges}>
          <AvailabilityBadges availability={entry.availability} myServices={myServices} compact />
        </div>
      </div>
    </article>
  );
}

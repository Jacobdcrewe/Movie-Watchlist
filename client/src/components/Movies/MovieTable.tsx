import type { WatchlistEntry } from '../../../../shared/types';
import { runtime, stars } from '../../lib/format';
import { serviceColor } from '../../lib/serviceColor';
import type { MovieActions } from './types';
import styles from './MovieTable.module.css';

interface Props extends MovieActions {
  entries: WatchlistEntry[];
}

/** Where-to-watch summary: streaming services (yours first), else the cheapest way in. */
function WatchCell({ entry, myServices }: { entry: WatchlistEntry; myServices: number[] }) {
  const { stream, rent, buy } = entry.availability;
  if (!stream.length) {
    const fallback = rent.length ? ['Rent', rent] : buy.length ? ['Buy', buy] : null;
    if (!fallback) return <span className={styles.none}>Not available</span>;
    const [kind, list] = fallback as [string, typeof rent];
    return (
      <span className={styles.none} title={list.map((p) => p.name).join(', ')}>
        <span className={styles.kind}>{kind.toUpperCase()}</span> {list[0].name}
        {list.length > 1 && ` +${list.length - 1}`}
      </span>
    );
  }
  const ordered = [...stream].sort((a, b) => Number(myServices.includes(b.id)) - Number(myServices.includes(a.id)));
  return (
    <span className={styles.services} title={ordered.map((p) => p.name).join(', ')}>
      {ordered.map((p) => (
        <span key={p.id} className={`${styles.service} ${myServices.includes(p.id) ? styles.mine : ''}`}>
          <span className={styles.dot} style={{ background: serviceColor(p.name, p.id) }} />
          {p.name}
        </span>
      ))}
    </span>
  );
}

/** Compact text table for scanning the whole list at a glance. */
export function MovieTable({ entries, myServices, onOpen, onToggleWatched, onRemove }: Props) {
  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div className={`glass ${styles.panel}`}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.check} aria-label="Watched" />
            <th>Title</th>
            <th className={`${styles.num} ${styles.optional}`}>Runtime</th>
            <th className={styles.optional}>Genres</th>
            <th>Where to watch</th>
            <th className={`${styles.rating} ${styles.optional}`}>Rating</th>
            <th className={styles.actions} aria-label="Remove" />
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => {
            const { movie, watched, rating } = e;
            return (
              <tr
                key={movie.id}
                className={watched ? styles.watched : ''}
                tabIndex={0}
                onClick={() => onOpen(movie.id)}
                onKeyDown={(ev) => ev.key === 'Enter' && ev.target === ev.currentTarget && onOpen(movie.id)}
              >
                <td className={styles.check}>
                  <button
                    type="button"
                    className={`${styles.tick} ${watched ? styles.tickOn : ''}`}
                    title={watched ? 'Mark unwatched' : 'Mark watched'}
                    aria-pressed={watched}
                    onClick={stop(() => onToggleWatched(movie.id, !watched))}
                  >
                    ✓
                  </button>
                </td>
                <td className={styles.title}>
                  <span className={styles.titleText}>{movie.title}</span>
                  {movie.year && <span className={styles.year}>{movie.year}</span>}
                </td>
                <td className={`${styles.num} ${styles.muted} ${styles.optional}`}>{runtime(movie.runtime) || '—'}</td>
                <td className={`${styles.muted} ${styles.genres} ${styles.optional}`}>{movie.genres.join(', ') || '—'}</td>
                <td className={styles.watch}>
                  <WatchCell entry={e} myServices={myServices} />
                </td>
                <td className={`${styles.rating} ${styles.optional}`}>
                  {rating ? (
                    <span className={styles.stars}>{stars(rating)}</span>
                  ) : (
                    <span className={styles.muted}>★ {movie.score || '—'}</span>
                  )}
                </td>
                <td className={styles.actions}>
                  <button type="button" className={styles.remove} title="Remove" onClick={stop(() => onRemove(movie.id))}>
                    ×
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

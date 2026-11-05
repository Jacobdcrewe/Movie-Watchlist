import { useEffect, useRef } from 'react';
import type { WatchlistEntry, WatchlistPatch } from '../../../../shared/types';
import { dotJoin, runtime } from '../../lib/format';
import { backdropUrl, placeholderArt, posterUrl } from '../../lib/images';
import { NotesField } from './NotesField';
import { StarRating } from './StarRating';
import { WhereToWatch } from './WhereToWatch';
import styles from './Detail.module.css';

interface Props {
  entry: WatchlistEntry;
  regionName: string;
  myServices: number[];
  onClose: () => void;
  onUpdate: (id: number, patch: WatchlistPatch) => void;
  onRemove: (id: number) => void;
}

export function DetailDrawer({ entry, regionName, myServices, onClose, onUpdate, onRemove }: Props) {
  const { movie } = entry;
  const closeRef = useRef<HTMLButtonElement>(null);
  const hero = backdropUrl(movie.backdropPath) ?? posterUrl(movie.posterPath, 'w500');

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    return () => previous?.focus?.({ preventScroll: true });
  }, [movie.id]);

  return (
    <>
      <div className={styles.scrim} onClick={onClose} />
      <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label={movie.title}>
        <div className={styles.hero} style={{ background: placeholderArt(movie.id) }}>
          {hero && <img className={styles.heroImg} src={hero} alt="" />}
          <div className={styles.heroFade} />
          <button ref={closeRef} type="button" className={styles.close} onClick={onClose} title="Close" aria-label="Close">
            ×
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.intro}>
            <h2 className={styles.title}>{movie.title}</h2>
            <div className={styles.meta}>{dotJoin(movie.year, runtime(movie.runtime))}</div>
            {movie.genres.length > 0 && (
              <div className={styles.genres}>
                {movie.genres.map((g) => (
                  <span key={g} className={styles.genre}>
                    {g}
                  </span>
                ))}
              </div>
            )}
            {movie.overview && <p className={styles.overview}>{movie.overview}</p>}
          </div>

          <div className={styles.ratingBox}>
            <div className={styles.ratingLabel}>
              <span className="mono-label">YOUR RATING</span>
              <span className={styles.critics}>Critics {movie.score || '—'}/10</span>
            </div>
            <StarRating value={entry.rating} onChange={(rating) => onUpdate(movie.id, { rating })} />
          </div>

          <WhereToWatch availability={entry.availability} myServices={myServices} regionName={regionName} />

          <NotesField key={movie.id} value={entry.note} onSave={(note) => onUpdate(movie.id, { note })} />

          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={() => onUpdate(movie.id, { watched: !entry.watched })}>
              {entry.watched ? 'Mark as unwatched' : 'Mark as watched'}
            </button>
            <button type="button" className={styles.secondary} onClick={() => onRemove(movie.id)}>
              Remove
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

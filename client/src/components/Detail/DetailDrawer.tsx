import { CircleCheck, Play, RotateCcw, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Trailer, WatchlistEntry, WatchlistPatch } from '../../../../shared/types';
import { api } from '../../api/client';
import { dotJoin, runtime } from '../../lib/format';
import { backdropUrl, placeholderArt, posterUrl } from '../../lib/images';
import { useScrollLock } from '../../hooks/useScrollLock';
import { NotesField } from './NotesField';
import { StarRating } from './StarRating';
import { TrailerPlayer } from './TrailerPlayer';
import { WhereToWatch } from './WhereToWatch';
import styles from './Detail.module.css';
import { MoviePlayer } from './MoviePlayer';

interface Props {
  entry: WatchlistEntry;
  regionName: string;
  myServices: number[];
  onClose: () => void;
  onUpdate: (id: number, patch: WatchlistPatch) => void;
  onRemove: (id: number) => void;
  readOnly: boolean;
}

export function DetailDrawer({ entry, regionName, myServices, onClose, onUpdate, onRemove, readOnly }: Props) {
  const { movie } = entry;
  const closeRef = useRef<HTMLButtonElement>(null);
  const hero = backdropUrl(movie.backdropPath) ?? posterUrl(movie.posterPath, 'w500');
  useScrollLock();

  // The trailer button appears only once TMDB has a playable trailer for this movie.
  const [trailer, setTrailer] = useState<Trailer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playingMovie, setPlayingMovie] = useState(false);

  useEffect(() => {
    let live = true;
    setTrailer(null);
    setPlaying(false);
    setPlayingMovie(false);
    api
      .trailer(movie.id)
      .then((t) => live && setTrailer(t))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [movie.id]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    return () => previous?.focus?.({ preventScroll: true });
  }, [movie.id]);

  return (
    <>
      <div className={styles.scrim} onClick={onClose} />
      <aside className={`prism-edge ${styles.drawer}`} role="dialog" aria-modal="true" aria-label={movie.title}>
        {/* Scroll inside the rounded panel so the scrollbar stays within its shape. */}
        <div className={styles.scroller}>
        <div className={styles.hero} style={{ background: placeholderArt(movie.id) }}>
          {hero && <img className={styles.heroImg} src={hero} alt="" />}
          <div className={styles.heroFade} />
          {trailer && (
            <button type="button" className={styles.trailerBtn} onClick={() => setPlaying(true)}>
              <Play size={15} strokeWidth={2} fill="currentColor" aria-hidden />
              Play trailer
            </button>
          )}
          <div className={styles.heroActions}>
            {trailer && (
              <button type="button" className={styles.trailerBtn} onClick={() => setPlaying(true)}>
                <Play size={15} strokeWidth={2} fill="currentColor" aria-hidden />
                Play trailer
              </button>
            )}
            <button type="button" className={`${styles.trailerBtn} ${styles.heroWatch}`} onClick={() => setPlayingMovie(true)}>
              <Play size={15} strokeWidth={2} fill="currentColor" aria-hidden />
              Play Movie
            </button>
            </div>
        
          <button ref={closeRef} type="button" className={styles.close} onClick={onClose} title="Close" aria-label="Close">
            <X size={18} strokeWidth={2} aria-hidden />
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
            <StarRating value={entry.rating} readOnly={readOnly} onChange={(rating) => onUpdate(movie.id, { rating })} />
          </div>

          <WhereToWatch availability={entry.availability} myServices={myServices} regionName={regionName} title={movie.title} />

          <NotesField key={movie.id} value={entry.note} readOnly={readOnly} onSave={(note) => onUpdate(movie.id, { note })} />

          {readOnly ? (
            <div className={styles.readOnlyNote}>
              {entry.watched ? 'Watched · ' : ''}You have view-only access to this list.
            </div>
          ) : (
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={() => onUpdate(movie.id, { watched: !entry.watched })}>
              {entry.watched ? <RotateCcw size={16} strokeWidth={2} aria-hidden /> : <CircleCheck size={17} strokeWidth={2} aria-hidden />}
              {entry.watched ? 'Mark as unwatched' : 'Mark as watched'}
            </button>
            <button type="button" className={styles.secondary} onClick={() => onRemove(movie.id)}>
              <Trash2 size={16} strokeWidth={1.9} aria-hidden />
              Remove
            </button>
          </div>
          )}
        </div>
        </div>
      </aside>
      {playing && trailer && <TrailerPlayer trailer={trailer} title={movie.title} onClose={() => setPlaying(false)} />}
      {playingMovie && <MoviePlayer id={movie.id} title={movie.title} onClose={() => setPlayingMovie(false)} />}
    </>
  );
}

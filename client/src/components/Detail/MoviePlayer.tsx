import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import styles from './Detail.module.css';

interface Props {
  id: number;
  title: string;
  onClose: () => void;
}

/** A movie's trailer (YouTube, privacy-enhanced mode) in a centred 16:9 player over the drawer. */
export function MoviePlayer({ id, title, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useScrollLock();

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    // Capture Esc first so it closes only the player, not the drawer underneath.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      e.stopPropagation();
      close.current();
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      previous?.focus?.({ preventScroll: true });
    };
  }, []);

  const src = `https://streamhype.sc/alt-watch/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

  return (
    <>
      <div className={styles.playerScrim} onClick={onClose} />
      <div className={`prism-edge ${styles.player}`} role="dialog" aria-modal="true" aria-label={`${title} trailer`}>
        <iframe
          className={styles.playerFrame}
          src={src}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      {/* Outside the video so it never covers YouTube's own controls. */}
      <button ref={closeRef} type="button" className={`${styles.close} ${styles.playerClose}`} onClick={onClose} aria-label="Close trailer">
        <X size={18} strokeWidth={2} aria-hidden />
      </button>
    </>
  );
}

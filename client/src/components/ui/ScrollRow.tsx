import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './ScrollRow.module.css';

type Fade = 'none' | 'start' | 'end' | 'both';

interface Props {
  children: ReactNode;
  ariaLabel: string;
  /** `data-key` of the selected child; it's scrolled into view whenever it changes. */
  selectedKey?: string;
  className?: string;
}

/**
 * A single line of chips that scrolls sideways. Edges fade where there's more,
 * mouse users get arrow buttons and wheel scrolling, and focused chips are kept in view.
 */
export function ScrollRow({ children, ariaLabel, selectedKey, className = '' }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState<Fade>('none');

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const start = el.scrollLeft > 1;
    const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setFade(start && end ? 'both' : start ? 'start' : end ? 'end' : 'none');
  }, []);

  // Re-measure on scroll and whenever the row or its chips change size.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));
    return () => {
      el.removeEventListener('scroll', measure);
      ro.disconnect();
    };
  }, [measure, children]);

  // A vertical wheel over an overflowing row scrolls it sideways (until it hits an end).
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || el.scrollWidth <= el.clientWidth) return;
      const atStart = el.scrollLeft <= 0 && e.deltaY < 0;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 && e.deltaY > 0;
      if (atStart || atEnd) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Keep the selected chip visible (e.g. the active genre).
  useEffect(() => {
    if (!selectedKey) return;
    const chip = track.current?.querySelector<HTMLElement>(`[data-key="${CSS.escape(selectedKey)}"]`);
    chip?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }, [selectedKey]);

  const page = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: 'smooth' });
  };

  const canStart = fade === 'start' || fade === 'both';
  const canEnd = fade === 'end' || fade === 'both';

  return (
    <div className={`${styles.root} ${className}`}>
      <div
        ref={track}
        className={styles.track}
        data-fade={fade}
        role="group"
        aria-label={ariaLabel}
        // Tabbing to a chip hidden past the edge brings it into view.
        onFocus={(e) => (e.target as HTMLElement).scrollIntoView({ inline: 'nearest', block: 'nearest' })}
      >
        {children}
      </div>
      {canStart && (
        <button type="button" tabIndex={-1} className={`${styles.arrow} ${styles.left}`} onClick={() => page(-1)} aria-label="Scroll left">
          <ChevronLeft size={16} strokeWidth={2.2} aria-hidden />
        </button>
      )}
      {canEnd && (
        <button type="button" tabIndex={-1} className={`${styles.arrow} ${styles.right}`} onClick={() => page(1)} aria-label="Scroll right">
          <ChevronRight size={16} strokeWidth={2.2} aria-hidden />
        </button>
      )}
    </div>
  );
}

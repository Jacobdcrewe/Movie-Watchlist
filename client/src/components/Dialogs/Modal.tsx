import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import styles from './Dialogs.module.css';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}

/** Centered frosted dialog with a scrim. Esc / scrim click / × close it. */
export function Modal({ title, onClose, children, width = 420 }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useScrollLock();

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const first = panel.current?.querySelector<HTMLElement>('input, select, button:not([data-close])');
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // An open dropdown inside the dialog handles Esc itself (closes just the menu).
        if ((e.target as HTMLElement | null)?.closest?.('[aria-expanded="true"]')) return;
        e.stopPropagation();
        close.current();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      previous?.focus?.();
    };
  }, []);

  return (
    <>
      <div className={styles.scrim} onClick={onClose} />
      <div ref={panel} className={`prism-edge ${styles.modal}`} style={{ width }} role="dialog" aria-modal="true" aria-label={title}>
        <div className={styles.scroller}>
        <div className={styles.head}>
          <h2 className={styles.title}>{title}</h2>
          <button type="button" data-close className={styles.close} onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={2} aria-hidden />
          </button>
        </div>
        {children}
        </div>
      </div>
    </>
  );
}

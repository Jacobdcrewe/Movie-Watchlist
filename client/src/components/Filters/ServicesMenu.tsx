import { Check, ChevronDown, Plus } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import type { Provider } from '../../../../shared/types';
import { ServiceLogo } from '../ui/ServiceLogo';
import styles from './ServicesMenu.module.css';

interface Props {
  services: Provider[];
  myServices: number[];
  onToggle: (id: number) => void;
  regionName: string;
}

const STACK = 3;

/**
 * "My services" pill: stacked logos of the services you subscribe to plus a count.
 * Opens a checklist popover; each tick saves immediately.
 */
export function ServicesMenu({ services, myServices, onToggle, regionName }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const popId = useId();

  const mine = services.filter((s) => myServices.includes(s.id));

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) trigger.current?.focus();
  };

  // Focus the first row on open; outside click closes.
  useEffect(() => {
    if (!open) return;
    list.current?.querySelector<HTMLElement>('[role="menuitemcheckbox"]')?.focus();
    const onDown = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const onKey = (e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close();
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const rows = Array.from(list.current?.querySelectorAll<HTMLElement>('[role="menuitemcheckbox"]') ?? []);
    const i = rows.indexOf(document.activeElement as HTMLElement);
    const next = rows[Math.min(rows.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)))];
    if (next) {
      e.preventDefault();
      next.focus();
    }
  };

  return (
    <div className={styles.root} ref={root} onKeyDown={onKey}>
      <button
        ref={trigger}
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popId : undefined}
        aria-label={`My services: ${mine.length ? mine.map((s) => s.name).join(', ') : 'none selected'}`}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <span className={styles.stack} aria-hidden>
          {mine.length === 0 ? (
            <span className={styles.stackEmpty}>
              <Plus size={13} strokeWidth={2.4} />
            </span>
          ) : (
            mine.slice(0, STACK).map((s) => (
              <span key={s.id} className={styles.stackItem}>
                <ServiceLogo provider={s} size={22} fallback="initial" />
              </span>
            ))
          )}
        </span>
        <span className={styles.label}>My services</span>
        {mine.length > 0 && <span className={styles.count}>{mine.length}</span>}
        <ChevronDown className={styles.chevron} size={15} strokeWidth={2.2} aria-hidden />
      </button>

      {open && (
        <div id={popId} className={`prism-edge ${styles.pop}`} role="dialog" aria-label="My services">
          <div className={styles.head}>
            <span className={styles.title}>My services</span>
            <span className="mono-label">{regionName.toUpperCase()}</span>
          </div>
          <div ref={list} className={styles.list} role="menu" aria-label="Streaming services">
            {services.length === 0 && <div className={styles.empty}>Loading services…</div>}
            {services.map((s) => {
              const on = myServices.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={on}
                  className={`${styles.row} ${on ? styles.rowOn : ''}`}
                  onClick={() => onToggle(s.id)}
                >
                  <ServiceLogo provider={s} size={28} fallback="initial" />
                  <span className={styles.name}>{s.name}</span>
                  <span className={`${styles.check} ${on ? styles.checkOn : ''}`} aria-hidden>
                    {on && <Check size={13} strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
          <button type="button" className={styles.done} onClick={() => close()}>
            Done
          </button>
        </div>
      )}
    </div>
  );
}

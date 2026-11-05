import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import styles from './Dropdown.module.css';

export interface DropdownOption<V extends string> {
  value: V;
  label: string;
  /** Small mono tag shown before the label (e.g. a country code). */
  tag?: string;
}

interface Props<V extends string> {
  value: V;
  options: DropdownOption<V>[];
  onChange: (v: V) => void;
  /** Accessible name, e.g. "Region". */
  label: string;
  /** Shown at the start of the trigger (icon or short label). */
  leading?: ReactNode;
  /** Align the menu to the trigger's right edge (for controls near the right of the screen). */
  alignRight?: boolean;
  className?: string;
}

/**
 * A select replacement in the frosted style (native <select> menus can't be styled).
 * Keyboard: ↑/↓ move, Home/End jump, Enter/Space choose, Esc/Tab close.
 */
export function Dropdown<V extends string>({ value, options, onChange, label, leading, alignRight, className = '' }: Props<V>) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const current = options.find((o) => o.value === value) ?? options[0];

  const openMenu = () => {
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) trigger.current?.focus();
  };
  const choose = (i: number) => {
    onChange(options[i].value);
    close();
  };

  // Click outside closes.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const onKey = (e: KeyboardEvent) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    const last = options.length - 1;
    const moves: Record<string, () => void> = {
      ArrowDown: () => setActive((i) => Math.min(last, i + 1)),
      ArrowUp: () => setActive((i) => Math.max(0, i - 1)),
      Home: () => setActive(0),
      End: () => setActive(last),
      Enter: () => choose(active),
      ' ': () => choose(active),
      Escape: () => close(),
    };
    if (e.key === 'Tab') return close(false);
    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      e.stopPropagation();
      move();
    }
  };

  return (
    <div className={`${styles.root} ${className}`} ref={root} onKeyDown={onKey}>
      <button
        ref={trigger}
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`${label}: ${current?.label}`}
        onClick={() => (open ? close() : openMenu())}
      >
        {leading}
        <span className={styles.value}>{current?.label}</span>
        <ChevronDown className={styles.chevron} size={15} strokeWidth={2.2} aria-hidden />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          aria-activedescendant={`${listId}-${active}`}
          className={`${styles.menu} ${alignRight ? styles.right : ''}`}
        >
          {options.map((o, i) => {
            const selected = o.value === value;
            return (
              <li
                key={o.value}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={selected}
                className={`${styles.option} ${i === active ? styles.active : ''} ${selected ? styles.selected : ''}`}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(i)}
              >
                {o.tag && <span className={styles.tag}>{o.tag}</span>}
                <span className={styles.label}>{o.label}</span>
                <span className={styles.check}>{selected && <Check size={15} strokeWidth={2.5} aria-hidden />}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

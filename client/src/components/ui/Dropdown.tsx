import { Check, ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from './Dropdown.module.css';

export interface DropdownOption<V extends string> {
  value: V;
  label: string;
  /** Small mono tag shown before the label (e.g. a country code). */
  tag?: string;
  /** Icon shown before the label. */
  icon?: ReactNode;
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
  /** 'field' (default) matches inputs; 'glass' matches the toolbar's frosted pills. */
  variant?: 'field' | 'glass';
  /** 'sm' is a compact 32px trigger for dense rows. */
  size?: 'md' | 'sm';
  disabled?: boolean;
  className?: string;
}

/**
 * A select replacement in the frosted style (native <select> menus can't be styled).
 * Keyboard: ↑/↓ move, Home/End jump, Enter/Space choose, Esc/Tab close.
 *
 * The menu is portaled to <body> with fixed positioning so scrolling containers
 * (e.g. a dialog body) can't clip it; it flips above the trigger when there's no room below.
 */
export function Dropdown<V extends string>({
  value,
  options,
  onChange,
  label,
  leading,
  alignRight,
  variant = 'field',
  size = 'md',
  disabled = false,
  className = '',
}: Props<V>) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLUListElement>(null);
  const listId = useId();
  const current = options.find((o) => o.value === value) ?? options[0];

  const openMenu = () => {
    if (disabled) return;
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

  // Click outside (the trigger and the portaled menu) closes.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!root.current?.contains(t) && !menu.current?.contains(t)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Place the menu under (or above) the trigger, and keep it attached while scrolling/resizing.
  const place = useCallback(() => {
    const t = trigger.current?.getBoundingClientRect();
    const m = menu.current;
    if (!t || !m) return;
    const gap = 8;
    const h = m.offsetHeight;
    const w = Math.max(m.offsetWidth, t.width);
    const below = window.innerHeight - t.bottom - gap;
    const flipUp = below < h + gap && t.top > below;
    const top = flipUp ? t.top - gap - h : t.bottom + gap;
    let left = alignRight ? t.right - w : t.left;
    left = Math.min(Math.max(8, left), window.innerWidth - w - 8);
    m.style.top = `${Math.round(top)}px`;
    m.style.left = `${Math.round(left)}px`;
    m.style.minWidth = `${Math.max(t.width, 210)}px`;
    m.dataset.placement = flipUp ? 'top' : 'bottom';
  }, [alignRight]);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    let raf = 0;
    const onMove = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(place);
    };
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [open, place]);

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
        className={`${styles.trigger} ${variant === 'glass' ? `glass ${styles.triggerGlass}` : ''} ${size === 'sm' ? styles.sm : ''} ${open ? styles.triggerOpen : ''}`}
        disabled={disabled}
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

      {open &&
        createPortal(
        <ul
          ref={menu}
          id={listId}
          role="listbox"
          aria-label={label}
          aria-activedescendant={`${listId}-${active}`}
          className={`prism-edge ${styles.menu}`}
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
                {o.icon && <span className={styles.optionIcon}>{o.icon}</span>}
                <span className={styles.label}>{o.label}</span>
                <span className={styles.check}>{selected && <Check size={15} strokeWidth={2.5} aria-hidden />}</span>
              </li>
            );
          })}
        </ul>,
          document.body,
        )}
    </div>
  );
}

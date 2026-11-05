import { Check, ChevronDown, LogOut, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { WatchList } from '../../../../shared/types';
import styles from './ListSwitcher.module.css';

const ROLE_TAG: Record<WatchList['role'], string> = { owner: '', editor: 'CAN EDIT', viewer: 'VIEW ONLY' };

interface Props {
  lists: WatchList[];
  current: WatchList | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: () => void;
  onShare: () => void;
  onDelete: () => void;
}

/** The page title doubles as the list picker; list actions live in the same menu. */
export function ListSwitcher({ lists, current, onSelect, onNew, onRename, onShare, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const act = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  const owned = lists.filter((l) => l.role === 'owner');
  const shared = lists.filter((l) => l.role !== 'owner');
  const isOwner = current?.role === 'owner';
  const onlyOwned = isOwner && owned.length === 1;

  const item = (l: WatchList) => (
    <button
      key={l.id}
      type="button"
      role="menuitemradio"
      aria-checked={l.id === current?.id}
      className={`${styles.item} ${l.id === current?.id ? styles.active : ''}`}
      onClick={act(() => onSelect(l.id))}
    >
      <span className={styles.check}>{l.id === current?.id && <Check size={15} strokeWidth={2.5} aria-hidden />}</span>
      <span className={styles.itemName}>{l.name}</span>
      {l.role === 'owner' && l.shared && <span className={styles.tag}>SHARED</span>}
      {ROLE_TAG[l.role] && <span className={styles.tag}>{ROLE_TAG[l.role]}</span>}
    </button>
  );

  return (
    <div className={styles.root} ref={root}>
      <div className={styles.titleRow}>
        <button
          type="button"
          className={styles.trigger}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <h1 className={styles.title}>{current?.name ?? 'Watchlist'}</h1>
          <ChevronDown className={styles.chevron} size={22} strokeWidth={2.2} aria-hidden />
        </button>
        {current && (
          <button type="button" className={`glass ${styles.shareBtn}`} onClick={onShare} title={isOwner ? 'Share this list' : 'People on this list'}>
            <Users size={15} strokeWidth={1.9} aria-hidden />
            {isOwner ? 'Share' : 'People'}
          </button>
        )}
        {current && current.role !== 'owner' && (
          <span className={styles.badge}>{current.role === 'viewer' ? 'View only' : 'Shared with you'}</span>
        )}
      </div>

      {open && (
        <div className={`prism-edge ${styles.menu}`}>
          <div className={styles.menuScroll} role="menu">
          {owned.length > 0 && <div className={`mono-label ${styles.section}`}>YOUR LISTS</div>}
          {owned.map(item)}
          {shared.length > 0 && <div className={`mono-label ${styles.section}`}>SHARED WITH YOU</div>}
          {shared.map(item)}
          <div className={styles.divider} />
          <button type="button" role="menuitem" className={styles.item} onClick={act(onNew)}>
            <span className={styles.check}>
              <Plus size={15} strokeWidth={2.2} aria-hidden />
            </span>
            <span className={styles.itemName}>New list…</span>
          </button>
          {isOwner && (
            <button type="button" role="menuitem" className={styles.item} onClick={act(onRename)}>
              <span className={styles.check}>
                <Pencil size={14} strokeWidth={2} aria-hidden />
              </span>
              <span className={styles.itemName}>Rename “{current!.name}”…</span>
            </button>
          )}
          {current && !onlyOwned && (
            <button type="button" role="menuitem" className={`${styles.item} ${styles.dangerItem}`} onClick={act(onDelete)}>
              <span className={styles.check}>
                {isOwner ? <Trash2 size={14} strokeWidth={2} aria-hidden /> : <LogOut size={14} strokeWidth={2} aria-hidden />}
              </span>
              <span className={styles.itemName}>{isOwner ? `Delete “${current.name}”…` : `Leave “${current.name}”…`}</span>
            </button>
          )}
          </div>
        </div>
      )}
    </div>
  );
}

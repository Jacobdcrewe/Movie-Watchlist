import { useEffect, useRef, useState } from 'react';
import styles from './Detail.module.css';

/** Textarea that saves 500ms after typing stops, and flushes on unmount. */
export function NotesField({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  const pending = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const save = useRef(onSave);
  save.current = onSave;

  const flush = () => {
    clearTimeout(timer.current);
    if (pending.current !== null) {
      save.current(pending.current);
      pending.current = null;
    }
  };

  useEffect(() => flush, []);

  return (
    <section className={styles.section} style={{ gap: 8 }}>
      <label className={styles.sectionTitle} htmlFor="notes">
        Notes
      </label>
      <textarea
        id="notes"
        className={styles.notes}
        rows={3}
        value={draft}
        placeholder="Who recommended it, when to watch…"
        onChange={(e) => {
          setDraft(e.target.value);
          pending.current = e.target.value;
          clearTimeout(timer.current);
          timer.current = setTimeout(flush, 500);
        }}
        onBlur={flush}
      />
    </section>
  );
}

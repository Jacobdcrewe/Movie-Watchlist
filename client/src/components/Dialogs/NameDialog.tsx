import { useState, type FormEvent } from 'react';
import { Modal } from './Modal';
import styles from './Dialogs.module.css';

interface Props {
  title: string;
  initial?: string;
  submitLabel: string;
  onSubmit: (name: string) => Promise<void>;
  onClose: () => void;
}

/** Ask for a list name (new list / rename). */
export function NameDialog({ title, initial = '', submitLabel, onSubmit, onClose }: Props) {
  const [name, setName] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit(name);
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <form className={styles.body} onSubmit={submit}>
        <label className={styles.field}>
          <span className="mono-label">NAME</span>
          <input
            className={styles.input}
            value={name}
            maxLength={60}
            placeholder="e.g. Date night"
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        {error && <div className={styles.error}>{error}</div>}
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={styles.primary} disabled={busy || !name.trim()}>
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

interface ConfirmProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

/** Destructive confirmation (delete / leave list). */
export function ConfirmDialog({ title, message, confirmLabel, onConfirm, onClose }: ConfirmProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Modal title={title} onClose={onClose}>
      <div className={styles.body}>
        <p className={styles.text}>{message}</p>
        {error && <div className={styles.error}>{error}</div>}
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={`${styles.primary} ${styles.danger}`}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
                onClose();
              } catch (err) {
                setError((err as Error).message);
                setBusy(false);
              }
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

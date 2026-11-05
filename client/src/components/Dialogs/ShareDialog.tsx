import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { ListPerson, WatchList } from '../../../../shared/types';
import { api } from '../../api/client';
import { Modal } from './Modal';
import styles from './Dialogs.module.css';

type MemberRole = 'editor' | 'viewer';

const ROLE_LABEL: Record<string, string> = { owner: 'Owner', editor: 'Can edit', viewer: 'Can view' };

interface Props {
  list: WatchList;
  myId: string;
  onClose: () => void;
  /** Called after membership changes (so the switcher can show the "Shared" tag). */
  onChanged: () => void;
}

/** Who has access to a list; the owner can invite by email and change or remove access. */
export function ShareDialog({ list, myId, onClose, onChanged }: Props) {
  const isOwner = list.role === 'owner';
  const [people, setPeople] = useState<ListPerson[] | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>('editor');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .people(list.id)
      .then(setPeople)
      .catch((e: Error) => setError(e.message));
  }, [list.id]);

  useEffect(load, [load]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      load();
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const invite = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      await api.share(list.id, email, role);
      setEmail('');
    });
  };

  return (
    <Modal title={isOwner ? `Share “${list.name}”` : `People on “${list.name}”`} onClose={onClose} width={480}>
      <div className={styles.body}>
        {isOwner && (
          <form className={styles.inviteRow} onSubmit={invite}>
            <input
              className={styles.input}
              type="email"
              placeholder="friend@example.com"
              aria-label="Email to share with"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <select
              className={styles.roleSelect}
              value={role}
              aria-label="Access"
              onChange={(e) => setRole(e.target.value as MemberRole)}
            >
              <option value="editor">Can edit</option>
              <option value="viewer">Can view</option>
            </select>
            <button type="submit" className={styles.primary} disabled={busy || !email.trim()}>
              Share
            </button>
          </form>
        )}
        {isOwner && (
          <p className={styles.hint}>
            They need a Reel account first. Editors can add, remove, rate and mark movies watched; viewers can only look.
          </p>
        )}

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.people}>
          {people === null && <div className={styles.hint}>Loading…</div>}
          {people?.map((p) => {
            const me = p.userId === myId;
            return (
              <div key={p.userId} className={styles.person}>
                <span className={styles.avatar} aria-hidden>
                  {p.email.slice(0, 1).toUpperCase()}
                </span>
                <span className={styles.email}>
                  {p.email}
                  {me && <span className={styles.you}> (you)</span>}
                </span>
                {isOwner && p.role !== 'owner' ? (
                  <>
                    <select
                      className={styles.roleSelect}
                      value={p.role}
                      disabled={busy}
                      aria-label={`Access for ${p.email}`}
                      onChange={(e) => run(() => api.share(list.id, p.email, e.target.value as MemberRole))}
                    >
                      <option value="editor">Can edit</option>
                      <option value="viewer">Can view</option>
                    </select>
                    <button
                      type="button"
                      className={styles.removePerson}
                      title={`Remove ${p.email}`}
                      disabled={busy}
                      onClick={() => run(() => api.unshare(list.id, p.userId))}
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <span className={styles.roleTag}>{ROLE_LABEL[p.role]}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}

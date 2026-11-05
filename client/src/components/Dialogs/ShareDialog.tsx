import { Eye, Pencil, X } from 'lucide-react';
import { Dropdown } from '../ui/Dropdown';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { ListPerson, WatchList } from '../../../../shared/types';
import { api } from '../../api/client';
import { Modal } from './Modal';
import styles from './Dialogs.module.css';

type MemberRole = 'editor' | 'viewer';

const ROLE_LABEL: Record<string, string> = { owner: 'Owner', editor: 'Can edit', viewer: 'Can view' };

const ROLE_ICON = { size: 15, strokeWidth: 2, 'aria-hidden': true } as const;
const ROLE_OPTIONS = [
  { value: 'editor' as const, label: 'Can edit', icon: <Pencil {...ROLE_ICON} /> },
  { value: 'viewer' as const, label: 'Can view', icon: <Eye {...ROLE_ICON} /> },
];

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
            <Dropdown label="Access" value={role} options={ROLE_OPTIONS} onChange={setRole} />
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
                    <Dropdown
                      label={`Access for ${p.email}`}
                      size="sm"
                      alignRight
                      disabled={busy}
                      value={p.role as MemberRole}
                      options={ROLE_OPTIONS}
                      onChange={(r) => r !== p.role && run(() => api.share(list.id, p.email, r))}
                    />
                    <button
                      type="button"
                      className={styles.removePerson}
                      title={`Remove ${p.email}`}
                      disabled={busy}
                      onClick={() => run(() => api.unshare(list.id, p.userId))}
                    >
                      <X size={16} strokeWidth={2} aria-hidden />
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

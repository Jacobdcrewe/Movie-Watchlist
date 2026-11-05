import { useState, type FormEvent } from 'react';
import { Background } from '../components/Background';
import styles from './Login.module.css';

interface Props {
  onSignIn: (email: string, password: string) => Promise<void>;
}

/** Sign-in card. There's no sign-up: accounts are created in the Supabase dashboard. */
export function LoginScreen({ onSignIn }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSignIn(email, password);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className={styles.page}>
      <Background />
      <form className={`glass ${styles.card}`} onSubmit={submit}>
        <div className={styles.brand}>
          <div className={styles.logo} />
          <span className={styles.name}>Reel</span>
        </div>
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.sub}>Your watchlist is private — sign in to view and edit it.</p>

        <label className={styles.field}>
          <span className="mono-label">EMAIL</span>
          <input
            type="email"
            autoComplete="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
          />
        </label>
        <label className={styles.field}>
          <span className="mono-label">PASSWORD</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
          />
        </label>

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        <button type="submit" className={styles.submit} disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

/** Shown when the build is missing its Supabase / TMDB settings. */
export function SetupScreen({ missing }: { missing: string[] }) {
  return (
    <div className={styles.page}>
      <Background />
      <div className={`glass ${styles.card}`}>
        <div className={styles.brand}>
          <div className={styles.logo} />
          <span className={styles.name}>Reel</span>
        </div>
        <h1 className={styles.title}>Almost there</h1>
        <p className={styles.sub}>This build is missing configuration. Set these variables (see README → Deploy) and rebuild:</p>
        <ul className={styles.list}>
          {missing.map((m) => (
            <li key={m}>
              <code>{m}</code>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

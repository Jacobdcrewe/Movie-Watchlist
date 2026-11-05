import { useState, type FormEvent } from 'react';
import { Background } from '../components/Background';
import styles from './Login.module.css';

interface Props {
  onSignIn: (email: string, password: string) => Promise<void>;
  /** Resolves true when the account needs email confirmation before signing in. */
  onSignUp: (email: string, password: string) => Promise<boolean>;
}

type Mode = 'signin' | 'signup';
const MIN_PASSWORD = 8;

/** Sign in, or create an account. */
export function LoginScreen({ onSignIn, onSignUp }: Props) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState<string | null>(null);

  const signup = mode === 'signup';

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setConfirm('');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (signup) {
      if (password.length < MIN_PASSWORD) return setError(`Use at least ${MIN_PASSWORD} characters for your password.`);
      if (password !== confirm) return setError('The passwords don’t match.');
    }
    setBusy(true);
    try {
      if (signup) {
        const needsConfirmation = await onSignUp(email, password);
        if (needsConfirmation) {
          setCheckEmail(email.trim());
          setBusy(false);
        }
        // Otherwise the session arrives and the app replaces this screen.
      } else {
        await onSignIn(email, password);
      }
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  if (checkEmail) {
    return (
      <div className={styles.page}>
        <Background />
        <div className={`glass ${styles.card}`}>
          <div className={styles.brand}>
            <div className={styles.logo} />
            <span className={styles.name}>Reel</span>
          </div>
          <h1 className={styles.title}>Check your email</h1>
          <p className={styles.sub}>
            We sent a confirmation link to <strong>{checkEmail}</strong>. Open it on this device to finish creating your
            account — it’ll bring you straight back here, signed in.
          </p>
          <button
            type="button"
            className={styles.submit}
            onClick={() => {
              setCheckEmail(null);
              switchMode('signin');
            }}
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Background />
      <form className={`glass ${styles.card}`} onSubmit={submit}>
        <div className={styles.brand}>
          <div className={styles.logo} />
          <span className={styles.name}>Reel</span>
        </div>

        <div className={styles.tabs} role="tablist" aria-label="Sign in or create an account">
          {(['signin', 'signup'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              className={`${styles.tab} ${mode === m ? styles.tabOn : ''}`}
              onClick={() => switchMode(m)}
            >
              {m === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        <h1 className={styles.title}>{signup ? 'Create account' : 'Sign in'}</h1>
        <p className={styles.sub}>
          {signup
            ? 'Make your own watchlists and share them with friends.'
            : 'Your watchlists are private — sign in to view and edit them.'}
        </p>

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
            autoComplete={signup ? 'new-password' : 'current-password'}
            required
            minLength={signup ? MIN_PASSWORD : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
          />
        </label>
        {signup && (
          <label className={styles.field}>
            <span className="mono-label">CONFIRM PASSWORD</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={styles.input}
            />
          </label>
        )}

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        <button type="submit" className={styles.submit} disabled={busy}>
          {busy ? (signup ? 'Creating account…' : 'Signing in…') : signup ? 'Create account' : 'Sign in'}
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

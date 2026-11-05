import App from './App';
import { LoginScreen, SetupScreen } from './auth/LoginScreen';
import { useAuth } from './auth/useAuth';
import { supabaseConfigured } from './data/supabase';
import { tmdbConfigured } from './data/tmdb';

const missing = [
  !supabaseConfigured && 'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY',
  !tmdbConfigured && 'VITE_TMDB_READ_TOKEN',
].filter((m): m is string => !!m);

/** Gate: configuration check → sign-in → the app. */
export default function Root() {
  const { state, signIn, signOut } = useAuth();

  if (missing.length) return <SetupScreen missing={missing} />;
  if (state.status === 'loading') return null;
  if (state.status === 'signedOut') return <LoginScreen onSignIn={signIn} />;

  const { user } = state.session;
  // Keyed by user so all state resets if a different account signs in.
  return <App key={user.id} userEmail={user.email ?? ''} onSignOut={signOut} />;
}

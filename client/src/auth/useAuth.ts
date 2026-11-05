import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../data/supabase';

export type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; session: Session };

/** Supabase email/password session, kept in sync across tabs and token refreshes. */
export function useAuth() {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setState(data.session ? { status: 'signedIn', session: data.session } : { status: 'signedOut' });
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(session ? { status: 'signedIn', session } : { status: 'signedOut' });
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Wrong email or password.' : error.message);
  }, []);

  /**
   * Create an account. Returns true when Supabase wants the email confirmed
   * first (the default); false when the user is signed in straight away.
   */
  const signUp = useCallback(async (email: string, password: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      // The confirmation link brings them back to this site (local or GitHub Pages).
      options: { emailRedirectTo: window.location.origin + import.meta.env.BASE_URL },
    });
    if (error) throw new Error(error.message);
    return !data.session;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { state, signIn, signUp, signOut };
}

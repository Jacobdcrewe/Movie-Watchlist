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

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { state, signIn, signOut };
}

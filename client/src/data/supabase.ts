import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '';
// Supabase calls this the "publishable" key in newer projects and the "anon" key in older ones.
const anonKey =
  ((import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined)?.trim() ?? '';

export const supabaseConfigured = Boolean(url && anonKey);

/**
 * Supabase client. The anon key is public by design — access is enforced by
 * row-level security (see supabase/schema.sql), so it's safe in the bundle.
 */
export const supabase: SupabaseClient = createClient(url || 'http://localhost', anonKey || 'missing', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

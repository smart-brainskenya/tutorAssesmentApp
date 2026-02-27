import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * SECURITY: The anonymous key is intended for public frontend use.
 * However, it must be used in conjunction with strict Row Level Security (RLS)
 * policies on the Supabase side to ensure data is protected.
 *
 * We also include a defensive check to ensure the service_role key is never
 * accidentally leaked to the client via environment variables.
 */
let isServiceRole = false;
try {
  const parts = supabaseAnonKey.split('.');
  if (parts.length === 3) {
    // Decode JWT payload (base64url)
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    if (payload && payload.role === 'service_role') {
      isServiceRole = true;
    }
  }
} catch {
  // If decoding fails, we log a warning but don't block unless it's a confirmed service_role
  console.warn('[Supabase] Could not verify key role. Ensure RLS is enabled on your tables.');
}

if (isServiceRole) {
  throw new Error('SECURITY ERROR: Service role key detected in frontend! Use the anon key instead.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

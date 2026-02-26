import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User as Profile } from '../types';

type AuthStatus = 'INITIALIZING' | 'AUTHENTICATED' | 'UNAUTHENTICATED';

interface AuthContextType {
  user: SupabaseUser | null;
  profile: Profile | null;
  status: AuthStatus;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<AuthStatus>('INITIALIZING');

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data || data.is_active === false) {
        console.error('[AuthContext] Profile error or inactive:', error?.message);
        if (data?.is_active === false) await supabase.auth.signOut();
        setProfile(null);
        setStatus('UNAUTHENTICATED');
      } else {
        setProfile(data);
        setStatus('AUTHENTICATED');
        // Update last login timestamp silently
        await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', userId);
      }
    } catch (err) {
      console.error('[AuthContext] Unexpected fetch error:', err);
      setStatus('UNAUTHENTICATED');
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Safety timeout: If auth takes longer than 5s, force unauthenticated to unblock UI
    const safetyTimeout = setTimeout(() => {
      if (mounted && status === 'INITIALIZING') {
        console.warn('[AuthContext] Auth initialization timed out. Forcing state to UNAUTHENTICATED.');
        setStatus('UNAUTHENTICATED');
      }
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthContext] Auth event: ${event}`);
      
      if (!mounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        if (session?.user) {
          setUser(session.user);
          // Only fetch profile if we don't have it or if the user changed
          // We can optimize this by checking ID, but fetchProfile handles updates
          await fetchProfile(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setStatus('UNAUTHENTICATED');
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const value = {
    user,
    profile,
    status,
    isAdmin: profile?.role === 'admin',
    /**
     * Signs out the current user.
     * This invalidates the refresh token on the server and clears the local session.
     * The `onAuthStateChange` listener will detect the `SIGNED_OUT` event
     * and update the application state to UNAUTHENTICATED, triggering a redirect to /login.
     *
     * Note on Token Lifecycle:
     * - Access Token: Short-lived (default 1h). Used for RLS policies.
     * - Refresh Token: Long-lived. Used to obtain new access tokens.
     * - Logout: Revokes the refresh token immediately. Access tokens are stateless and remain valid until expiry,
     *   but the client discards them, effectively ending the session.
     */
    signOut: async () => {
      await supabase.auth.signOut();
    },
    refreshProfile: async () => {
      if (user) await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

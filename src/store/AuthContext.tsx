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

        // Update last login timestamp silently if it's more than 24h old or not set
        const lastLogin = data.last_login ? new Date(data.last_login).getTime() : 0;
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;

        if (now - lastLogin > twentyFourHours) {
          await supabase.from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', userId);
        }
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

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
    // 1. Initial session check
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setStatus('UNAUTHENTICATED');
      }
    };

    initAuth();

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthContext] Auth event: ${event}`);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setStatus('UNAUTHENTICATED');
      }
    });

    return () => subscription.unsubscribe();
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

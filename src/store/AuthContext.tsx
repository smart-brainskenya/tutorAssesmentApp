import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthContextType {
  user: SupabaseUser | null;
  profile: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[AuthContext] Role fetch failure:', error.message);
        setProfile(null);
      } else {
        if (data.is_active === false) {
          console.warn('[AuthContext] User deactivated, forcing logout');
          await supabase.auth.signOut();
          return;
        }
        setProfile(data);
        // Update last login timestamp silently
        await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', userId);
      }
    } catch (error) {
      console.error('[AuthContext] Unexpected profile fetch error:', error);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    // 1. Initial session check
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[AuthContext] Session fetch failure:', error.message);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error('[AuthContext] Init auth crash:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log(`[AuthContext] Auth event: ${event}`);
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id);
        }
      }

      if (event === 'SIGNED_OUT') {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const value = {
    user,
    profile,
    session,
    loading,
    isAdmin: profile?.role === 'admin',
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

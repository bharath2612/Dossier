import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    const initSession = async () => {
      console.log('[useAuth] Fetching initial session...');
      const { data } = await supabase.auth.getSession();
      console.log('[useAuth] Initial session:', data.session ? `exists (user: ${data.session.user?.email})` : 'none');
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    initSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      console.log('Auth state change:', event, session ? 'session exists' : 'no session');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signInWithGoogle = async () => {
    // Store current path to return after auth
    const returnPath = window.location.pathname + window.location.search;
    sessionStorage.setItem('auth_return_path', returnPath);

    // Use environment variable for redirect URL, fallback to current origin
    const redirectUrl = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      : `${window.location.origin}/auth/callback`;

    console.log('[useAuth] Signing in with redirect URL:', redirectUrl);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      console.error('Error signing in:', error);
      throw error;
    }

    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return {
    user,
    session,
    loading,
    signInWithGoogle,
    signOut,
  };
}

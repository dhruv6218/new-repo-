'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session as SupabaseSession, User as SupabaseUser } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '../lib/supabase/client';

export interface User {
  id: string;
  email: string;
  user_metadata: Record<string, unknown>;
  created_at: string;
}

export interface Session {
  access_token: string;
  user: User;
}

const DEMO_USER: User = {
  id: 'demo-user',
  email: 'demo@astrixai.app',
  user_metadata: { full_name: 'Demo User' },
  created_at: '2024-01-01T00:00:00.000Z',
};
const DEMO_SESSION: Session = { access_token: 'demo-session', user: DEMO_USER };

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isInitializing: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInAsAdmin: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password?: string) => Promise<{ error: string | null }>;
  signUp: (email: string, method?: string, name?: string, password?: string) => Promise<{ error: string | null; needsConfirmation?: boolean }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
}

const emptyContext: AuthContextType = {
  session: null, user: null, isInitializing: true, isAdmin: false,
  signOut: async () => {}, sendMagicLink: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }), signInAsAdmin: async () => ({ error: null }),
  signIn: async () => ({ error: null }), signUp: async () => ({ error: null, needsConfirmation: false }),
  resetPassword: async () => ({ error: null }), updatePassword: async () => ({ error: null }),
};
const AuthContext = createContext<AuthContextType>(emptyContext);

function mapUser(user: SupabaseUser): User {
  return {
    id: user.id,
    email: user.email ?? '',
    user_metadata: user.user_metadata ?? {},
    created_at: user.created_at,
  };
}

function mapSession(session: SupabaseSession | null): Session | null {
  return session ? { access_token: session.access_token, user: mapUser(session.user) } : null;
}

function origin() {
  return typeof window === 'undefined' ? '' : window.location.origin;
}

function errorMessage(error: { message?: string } | null) {
  return error?.message || 'Something went wrong. Please try again.';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient();
    } catch {
      return null;
    }
  }, []);
  const demo = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === 'true';
  const [session, setSession] = useState<Session | null>(() => demo ? DEMO_SESSION : null);
  const [user, setUser] = useState<User | null>(() => demo ? DEMO_USER : null);
  const [isInitializing, setIsInitializing] = useState(() => !demo && !!supabase);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (demo) {
      return;
    }
    if (!supabase) {
      return;
    }

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(mapSession(data.session));
        setUser(data.session ? mapUser(data.session.user) : null);
        setIsInitializing(false);
        if (data.session) {
          fetch('/api/admin/session').then(response => setIsAdmin(response.ok)).catch(() => setIsAdmin(false));
        }
      }
    }).catch(() => active && setIsInitializing(false));

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(mapSession(nextSession));
        setUser(nextSession ? mapUser(nextSession.user) : null);
        setIsInitializing(false);
        if (nextSession) {
          fetch('/api/admin/session').then(response => setIsAdmin(response.ok)).catch(() => setIsAdmin(false));
        } else {
          setIsAdmin(false);
        }
      }
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [demo, supabase]);

  const sendMagicLink = async (email: string) => {
    if (!supabase) return { error: 'Authentication is not configured. Please set the Supabase environment variables.' };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin()}/auth/confirm`, shouldCreateUser: true },
    });
    return { error: error ? errorMessage(error) : null };
  };

  const signIn = async (email: string, password?: string) => {
    if (!password) return sendMagicLink(email);
    if (!supabase) return { error: 'Authentication is not configured. Please set the Supabase environment variables.' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? errorMessage(error) : null };
  };

  const signUp = async (email: string, _method?: string, name?: string, password?: string) => {
    if (!supabase) return { error: 'Authentication is not configured. Please set the Supabase environment variables.', needsConfirmation: false };
    if (password) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin()}/auth/confirm?next=/onboarding/step-1`,
          data: name ? { full_name: name } : undefined,
        },
      });
      if (error) return { error: errorMessage(error), needsConfirmation: false };
      return { error: null, needsConfirmation: !data.session };
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin()}/auth/confirm?next=/onboarding/step-1`,
        shouldCreateUser: true,
        data: name ? { full_name: name } : undefined,
      },
    });
    return { error: error ? errorMessage(error) : null, needsConfirmation: !error };
  };

  const signInWithGoogle = async () => {
    if (!supabase) return { error: 'Authentication is not configured. Please set the Supabase environment variables.' };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${origin()}/auth/confirm?next=/app` },
    });
    return { error: error ? errorMessage(error) : null };
  };

  const resetPassword = async (email: string) => {
    if (!supabase) return { error: 'Authentication is not configured. Please set the Supabase environment variables.' };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin()}/auth/confirm?next=/reset-password`,
    });
    return { error: error ? errorMessage(error) : null };
  };

  const updatePassword = async (password: string) => {
    if (!supabase) return { error: 'Authentication is not configured. Please set the Supabase environment variables.' };
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error ? errorMessage(error) : null };
  };

  const signOut = async () => {
    if (!demo && supabase) await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setIsAdmin(false);
  };

  const signInAsAdmin = async (email: string, password: string) => {
    if (!email || !password) return { error: 'Please enter both admin email and password' };
    if (!supabase) return { error: 'Authentication is not configured. Please set the Supabase environment variables.' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: errorMessage(error) };
    const response = await fetch('/api/admin/session');
    if (!response.ok) {
      await supabase.auth.signOut();
      return { error: 'This account is not authorized for admin access.' };
    }
    setIsAdmin(true);
    return { error: null };
  };

  return <AuthContext.Provider value={{
    session, user, isInitializing, isAdmin, signOut, sendMagicLink, signInWithGoogle,
    signInAsAdmin, signIn, signUp, resetPassword, updatePassword,
  }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

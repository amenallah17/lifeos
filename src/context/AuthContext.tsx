'use client';

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { supabase, useSupabase } from '@/lib/supabase';
import { pullFromSupabase, startPeriodicSync, stopPeriodicSync } from '@/lib/sync';
import type { User, Session } from '@supabase/supabase-js';

const DEV_USER_KEY = 'lifeos-dev-user';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  devMode: boolean;
  setDevMode: (v: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  isOffline: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!useSupabase);
  const [devMode, setDevModeState] = useState(false);
  const devModeRef = useRef(devMode);
  function setDevMode(v: boolean) {
    devModeRef.current = v;
    setDevModeState(v);
  }

  // Sync data when user changes (login/logout)
  useEffect(() => {
    if (user && user.id && !user.id.startsWith('dev-')) {
      pullFromSupabase(user.id).then(() => startPeriodicSync(user.id));
    } else {
      stopPeriodicSync();
    }
    return () => stopPeriodicSync();
  }, [user?.id]);

  // Restore session and data from disk/localStorage on mount
  useEffect(() => {
    // 1. Load disk-persisted data into localStorage (synchronous — from preload)
    if (typeof window !== 'undefined' && window.electronAPI?.storageData) {
      const diskData = window.electronAPI.storageData;
      for (const [key, value] of Object.entries(diskData)) {
        try { localStorage.setItem(key, value as string); } catch {}
      }
    }

    // 2. Check for saved dev user
    const raw = localStorage.getItem(DEV_USER_KEY);
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        setUser(saved.user);
        setSession(saved.session);
        setDevMode(true);
        setLoading(false);
        return;
      } catch {}
    }

    // 3. Offline mode
    if (!useSupabase) {
      setLoading(false);
      setIsOffline(true);
      return;
    }

    // 4. Try Supabase session with timeout fallback
    const timer = setTimeout(() => {
      setLoading(false);
      setIsOffline(true);
    }, 7000);

    supabase!.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timer);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(() => {
      clearTimeout(timer);
      setLoading(false);
      setIsOffline(true);
    });

    const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  function createDevUser(email: string) {
    const devUser = {
      id: 'dev-' + Date.now(),
      email,
      user_metadata: { email },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as unknown as User;

    const devSession = {
      access_token: 'dev-token-' + Date.now(),
      refresh_token: 'dev-refresh-' + Date.now(),
      expires_in: 86400,
      expires_at: Math.floor(Date.now() / 1000) + 86400,
      token_type: 'bearer',
      user: devUser,
    } as Session;

    localStorage.setItem(DEV_USER_KEY, JSON.stringify({ user: devUser, session: devSession }));
    setUser(devUser);
    setSession(devSession);
    setDevMode(true);
    return devUser;
  }

  const signIn = async (email: string, password: string) => {
    // Try Supabase first with real credentials
    if (useSupabase) {
      try {
        const { error } = await supabase!.auth.signInWithPassword({ email, password });
        if (!error) return {};
        return { error: error.message };
      } catch {}
    }
    // Fallback: create local dev session
    setDevMode(true);
    createDevUser(email);
    return {};
  };

  const signUp = async (email: string, password: string) => {
    // Try Supabase first
    if (useSupabase) {
      try {
        const { error } = await supabase!.auth.signUp({ email, password });
        if (!error) return {};
      } catch {}
    }
    // Fallback: create local dev session
    setDevMode(true);
    createDevUser(email);
    return {};
  };

  const signOut = async () => {
    localStorage.removeItem(DEV_USER_KEY);
    if (useSupabase && !devMode) await supabase!.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, devMode, setDevMode, signIn, signUp, signOut, isOffline }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

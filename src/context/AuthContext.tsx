import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type AppUser = {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
};

type AuthResult = { success: boolean; message?: string };
type AuthContextType = {
  user: AppUser | null;
  isLoading: boolean;
  authElapsedSeconds: number;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, name: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<AuthContextType | null>(null);
const AUTH_START_TIME_KEY = 'lab6_auth_start_time';

async function appUserFromSupabase(authUser: SupabaseUser): Promise<AppUser> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, role')
    .eq('id', authUser.id)
    .maybeSingle();
  return {
    id: authUser.id,
    email: authUser.email ?? '',
    name: profile?.display_name || authUser.user_metadata?.display_name || authUser.email || 'Користувач',
    role: profile?.role === 'admin' ? 'admin' : 'user',
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authElapsedSeconds, setAuthElapsedSeconds] = useState(0);

  useEffect(() => {
    let alive = true;
    const applySession = async (session: Session | null) => {
      if (!alive) return;
      if (!session?.user) {
        setUser(null);
        setAuthElapsedSeconds(0);
        return;
      }
      const nextUser = await appUserFromSupabase(session.user);
      if (alive) setUser(nextUser);
      const savedStart = await AsyncStorage.getItem(AUTH_START_TIME_KEY);
      if (!savedStart) await AsyncStorage.setItem(AUTH_START_TIME_KEY, String(Date.now()));
      const start = Number(savedStart || Date.now());
      if (alive) setAuthElapsedSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    };

    supabase.auth.getSession().then(({ data }) => applySession(data.session).finally(() => {
      if (alive) setIsLoading(false);
    }));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer Supabase calls until after the auth callback completes.
      Promise.resolve().then(() => applySession(session));
    });
    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const timer = setInterval(() => {
      AsyncStorage.getItem(AUTH_START_TIME_KEY).then(value => {
        if (value) setAuthElapsedSeconds(Math.max(0, Math.floor((Date.now() - Number(value)) / 1000)));
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [user]);

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    if (!email.trim() || !password) return { success: false, message: 'Введіть email і пароль.' };
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) return { success: false, message: error.message };
    await AsyncStorage.setItem(AUTH_START_TIME_KEY, String(Date.now()));
    return { success: true };
  };

  const signUp = async (email: string, password: string, name: string): Promise<AuthResult> => {
    if (!email.trim() || password.length < 6) return { success: false, message: 'Вкажіть email і пароль щонайменше з 6 символів.' };
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(), password,
      options: { data: { display_name: name.trim() || email.trim() } },
    });
    if (error) return { success: false, message: error.message };
    if (data.user && data.session) {
      await supabase.from('profiles').upsert({ id: data.user.id, display_name: name.trim() || email.trim(), role: 'user' });
      await AsyncStorage.setItem(AUTH_START_TIME_KEY, String(Date.now()));
      return { success: true };
    }
    return { success: true, message: 'Перевірте пошту для підтвердження реєстрації, якщо підтвердження ввімкнене в Supabase.' };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem(AUTH_START_TIME_KEY);
    setUser(null);
    setAuthElapsedSeconds(0);
  };

  return <AuthContext.Provider value={{ user, isLoading, authElapsedSeconds, signIn, signUp, signOut }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

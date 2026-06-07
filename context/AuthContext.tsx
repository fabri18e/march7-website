'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';
import { tiktokIdentify } from '@/lib/tiktok';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setLoading(false);
      if (u) tiktokIdentify(u.email, u.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await getSupabase().auth.signOut();
    setUser(null);
  };

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isAdmin = !!user && !!adminEmail && user.email === adminEmail;

  return (
    <AuthContext.Provider value={{ user, loading, signOut, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

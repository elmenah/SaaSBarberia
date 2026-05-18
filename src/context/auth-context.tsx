"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type BarbershopInfo = {
  id: string;
  name: string;
  slug: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
};

type AuthContextValue = {
  user: User | null;
  barbershop: BarbershopInfo | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshBarbershop: () => Promise<void>;
};

// ─── Contexto ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user: null,
  barbershop: null,
  loading: true,
  signOut: async () => {},
  refreshBarbershop: async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,       setUser]       = useState<User | null>(null);
  const [barbershop, setBarbershop] = useState<BarbershopInfo | null>(null);
  const [loading,    setLoading]    = useState(true);

  const fetchBarbershop = useCallback(async () => {
    try {
      const res = await fetch("/api/barbershop");
      if (res.ok) {
        const data = await res.json();
        setBarbershop(data.barbershop ?? null);
      }
    } catch {
      // silent — no barbershop found
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();

    // Obtener sesión inicial — esperar barbershop antes de apagar loading
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user) await fetchBarbershop();
      setLoading(false);
    });

    // Escuchar cambios de auth (login, logout, refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          fetchBarbershop();
        } else {
          setBarbershop(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchBarbershop]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setBarbershop(null);
  }

  return (
    <AuthContext.Provider value={{
      user,
      barbershop,
      loading,
      signOut,
      refreshBarbershop: fetchBarbershop,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  return useContext(AuthContext);
}

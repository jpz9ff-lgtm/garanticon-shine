import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface DealerInfo {
  id: string;
  nombre_empresa: string;
  cif: string;
  email: string;
  activo: boolean;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  dealer: DealerInfo | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshDealer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [dealer, setDealer] = useState<DealerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDealer = async (userId: string) => {
    const { data } = await supabase
      .from("dealers")
      .select("id, nombre_empresa, cif, email, activo")
      .eq("user_id", userId)
      .maybeSingle();
    setDealer(data ?? null);
  };

  useEffect(() => {
    // 1) listener primero
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        // diferido para evitar deadlock
        setTimeout(() => loadDealer(sess.user.id), 0);
      } else {
        setDealer(null);
      }
    });

    // 2) luego sesión actual
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        loadDealer(sess.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (data.user) {
      // Pequeño retry: a veces el JWT tarda un instante en aplicarse al cliente PostgREST
      let d: DealerInfo | null = null;
      for (let i = 0; i < 4; i++) {
        const { data: row } = await supabase
          .from("dealers")
          .select("id, nombre_empresa, cif, email, activo")
          .eq("user_id", data.user.id)
          .maybeSingle();
        if (row) { d = row as DealerInfo; break; }
        await new Promise((r) => setTimeout(r, 200));
      }
      if (!d) {
        await supabase.auth.signOut();
        return { error: "Esta cuenta no tiene un dealer asociado. Contacta con garanticon.es" };
      }
      if (!d.activo) {
        await supabase.auth.signOut();
        return { error: "Cuenta desactivada. Contacta con garanticon.es" };
      }
      setDealer(d);
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setDealer(null);
  };

  const refreshDealer = async () => {
    if (user) await loadDealer(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, session, dealer, loading, signIn, signOut, refreshDealer }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
};
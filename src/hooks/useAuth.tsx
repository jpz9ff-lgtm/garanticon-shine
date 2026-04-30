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

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

  const loadDealer = async (userId: string, options?: { retries?: number; delayMs?: number }) => {
    const retries = options?.retries ?? 6;
    const delayMs = options?.delayMs ?? 400;

    let dealerData: DealerInfo | null = null;

    for (let attempt = 0; attempt < retries; attempt += 1) {
      const { data, error } = await supabase
        .from("dealers")
        .select("id, nombre_empresa, cif, email, activo")
        .eq("user_id", userId)
        .maybeSingle();

      if (data) {
        dealerData = data as DealerInfo;
        break;
      }

      if (!error) {
        break;
      }

      if (attempt < retries - 1) {
        await wait(delayMs * (attempt + 1));
      }
    }

    setDealer(dealerData);
    return dealerData;
  };

  useEffect(() => {
    const syncAuthState = async (sess: Session | null) => {
      setSession(sess);
      setUser(sess?.user ?? null);

      if (sess?.user) {
        setLoading(true);
        await loadDealer(sess.user.id);
        setLoading(false);
      } else {
        setDealer(null);
        setLoading(false);
      }
    };

    // 1) listener primero
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setTimeout(() => {
        void syncAuthState(sess);
      }, 0);
    });

    // 2) luego sesión actual
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      void syncAuthState(sess);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return { error: error.message };
    }

    setSession(data.session ?? null);
    setUser(data.user ?? null);

    if (data.user) {
      const d = await loadDealer(data.user.id, { retries: 8, delayMs: 500 });
      if (!d) {
        await supabase.auth.signOut();
        setLoading(false);
        return { error: "Esta cuenta no tiene un dealer asociado. Contacta con garanticon.es" };
      }
      if (!d.activo) {
        await supabase.auth.signOut();
        setLoading(false);
        return { error: "Cuenta desactivada. Contacta con garanticon.es" };
      }
      setDealer(d);
    }

    setLoading(false);
    return { error: null };
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setDealer(null);
    setLoading(false);
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
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
  dealerError: string | null;
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
  const [dealerError, setDealerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDealer = async (userId: string, options?: { retries?: number; delayMs?: number }) => {
    const retries = options?.retries ?? 8;
    const delayMs = options?.delayMs ?? 300;

    let dealerData: DealerInfo | null = null;
    let lastError: string | null = null;

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
        // No row yet — wait and retry in case of replication lag right after signup
        if (attempt < retries - 1) {
          await wait(delayMs * (attempt + 1));
          continue;
        }
        break;
      }

      if (error.code === "PGRST002" || error.message.toLowerCase().includes("schema cache")) {
        lastError = "El backend está respondiendo con retraso y no ha podido cargar tu concesionario todavía.";
      } else {
        lastError = "No se ha podido cargar tu concesionario asociado.";
      }

      if (attempt < retries - 1) {
        await wait(delayMs * (attempt + 1));
      }
    }

    return {
      dealer: dealerData,
      error: dealerData ? null : lastError,
    };
  };

  useEffect(() => {
    let cancelled = false;

    const syncAuthState = async (sess: Session | null) => {
      if (cancelled) return;
      setLoading(true);
      setSession(sess);
      setUser(sess?.user ?? null);

      if (sess?.user) {
        setDealerError(null);
        const { dealer: loadedDealer, error } = await loadDealer(sess.user.id);
        if (cancelled) return;
        setDealer(loadedDealer);
        setDealerError(error);
        setLoading(false);
      } else {
        setDealer(null);
        setDealerError(null);
        setLoading(false);
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      // Defer to avoid deadlocks inside the auth callback
      setTimeout(() => {
        void syncAuthState(sess);
      }, 0);
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      void syncAuthState(sess);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setDealerError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return { error: error.message };
    }
    // El listener onAuthStateChange se encargará de cargar el dealer y poner loading=false.
    return { error: null };
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setDealer(null);
    setDealerError(null);
    setLoading(false);
  };

  const refreshDealer = async () => {
    if (user) {
      setLoading(true);
      setDealerError(null);
      const { dealer: loadedDealer, error } = await loadDealer(user.id);
      setDealer(loadedDealer);
      setDealerError(error);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, dealer, dealerError, loading, signIn, signOut, refreshDealer }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
};
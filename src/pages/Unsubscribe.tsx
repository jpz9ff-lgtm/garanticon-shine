import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type State = "loading" | "valid" | "already" | "invalid" | "submitting" | "done" | "error";

const Unsubscribe = () => {
  const [state, setState] = useState<State>("loading");
  const token = new URLSearchParams(window.location.search).get("token");

  useEffect(() => {
    const validate = async () => {
      if (!token) { setState("invalid"); return; }
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`;
        const res = await fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } });
        const data = await res.json();
        if (data?.valid === true) setState("valid");
        else if (data?.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      } catch { setState("invalid"); }
    };
    validate();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setState("submitting");
    const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
    if (error) { setState("error"); return; }
    if ((data as any)?.success || (data as any)?.reason === "already_unsubscribed") setState("done");
    else setState("error");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-3xl bg-card p-10 text-center shadow-soft">
        <h1 className="text-2xl font-bold text-foreground">Cancelar suscripción</h1>

        {state === "loading" && (
          <div className="mt-6 flex items-center justify-center text-muted-foreground"><Loader2 className="mr-2 animate-spin" /> Comprobando…</div>
        )}
        {state === "valid" && (
          <>
            <p className="mt-4 text-muted-foreground">¿Confirmas que deseas dejar de recibir emails de Garanticon?</p>
            <Button onClick={confirm} className="mt-6 h-12 w-full rounded-xl">Confirmar baja</Button>
          </>
        )}
        {state === "submitting" && (
          <div className="mt-6 flex items-center justify-center text-muted-foreground"><Loader2 className="mr-2 animate-spin" /> Procesando…</div>
        )}
        {state === "done" && <p className="mt-6 text-foreground">Te has dado de baja correctamente.</p>}
        {state === "already" && <p className="mt-6 text-foreground">Ya estabas dado de baja.</p>}
        {state === "invalid" && <p className="mt-6 text-destructive">Enlace no válido o caducado.</p>}
        {state === "error" && <p className="mt-6 text-destructive">No pudimos procesar tu solicitud. Inténtalo de nuevo.</p>}
      </div>
    </main>
  );
};

export default Unsubscribe;
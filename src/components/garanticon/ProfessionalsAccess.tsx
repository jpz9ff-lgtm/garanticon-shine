import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const inputCls =
  "h-12 rounded-xl border-border bg-background text-base transition-all focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";

export const ProfessionalsAccess = () => {
  const navigate = useNavigate();
  const { signIn, user, loading } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      navigate("/dealer/dashboard", { replace: true });
    }
  }, [loading, navigate, user]);

  useEffect(() => {
    if (!loading) {
      setSubmitting(false);
    }
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    console.log("Login clicked");
    e.preventDefault();
    if (submitting) return;

    const trimmedIdentifier = identifier.trim();
    const trimmedPassword = password.trim();

    if (!trimmedIdentifier || !trimmedPassword) {
      const message = "Introduce tu usuario o email y tu contraseña.";
      setFormError(message);
      toast({
        variant: "destructive",
        title: "Faltan datos",
        description: message,
      });
      return;
    }

    setFormError(null);
    setSubmitting(true);

    let loginEmail = trimmedIdentifier;

    try {
      if (!loginEmail.includes("@")) {
        const { data, error: fnErr } = await supabase.functions.invoke("resolve-username", {
          body: { username: loginEmail },
        });

        if (fnErr) {
          throw new Error(fnErr.message || "No se ha podido resolver el usuario.");
        }

        if (!data?.email) {
          const message = "Revisa el nombre de usuario o usa tu email.";
          setFormError(message);
          toast({
            variant: "destructive",
            title: "Usuario no encontrado",
            description: message,
          });
          return;
        }

        loginEmail = data.email;
      }

      const { error } = await signIn(loginEmail, trimmedPassword);

      if (error) {
        setFormError(error);
        toast({
          variant: "destructive",
          title: "No se ha podido iniciar sesión",
          description: error,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Inténtalo de nuevo en unos segundos.";
      console.error("Professional login failed", error);
      setFormError(message);
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="professionals" className="bg-background px-6 py-24">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-primary">Profesionales</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-foreground md:text-5xl">
            ¿Eres taller o concesionario colaborador? Regístrate
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Accede al área profesional para gestionar garantías, solicitudes y comunicaciones con Garanticon.
          </p>
        </div>

        <form className="rounded-3xl bg-card p-8 shadow-soft" onSubmit={handleSubmit}>
          <h3 className="text-2xl font-bold text-foreground">Log in</h3>
          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="professional-user" className="text-sm font-semibold">Usuario</Label>
              <Input
                id="professional-user"
                required
                className={inputCls}
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="professional-password" className="text-sm font-semibold">Contraseña</Label>
              <Input
                id="professional-password"
                type="password"
                required
                className={inputCls}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={submitting || loading}
              className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground hover:brightness-110"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar"}
            </Button>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full rounded-xl text-base font-semibold"
              onClick={() => navigate("/asistencia")}
            >
              Registrarme
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
};
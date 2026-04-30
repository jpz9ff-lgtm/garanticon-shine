import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/garanticon/Logo";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    // Supabase coloca el token en el hash y dispara PASSWORD_RECOVERY al cargar.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    // Fallback: si ya hay sesión activa de recuperación o el hash trae type=recovery
    supabase.auth.getSession().then(({ data }) => {
      const hash = window.location.hash || "";
      if (data.session && hash.includes("type=recovery")) {
        setReady(true);
      } else if (!data.session && !hash.includes("type=recovery")) {
        setInvalid(true);
      } else if (data.session) {
        setReady(true);
      }
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ variant: "destructive", title: "Contraseña demasiado corta", description: "Usa al menos 8 caracteres." });
      return;
    }
    if (password !== confirm) {
      toast({ variant: "destructive", title: "Las contraseñas no coinciden" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      toast({ variant: "destructive", title: "No se pudo actualizar", description: error.message });
      return;
    }
    toast({ title: "Contraseña actualizada", description: "Ya puedes iniciar sesión." });
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-6 py-12">
      <h1 className="sr-only">Restablecer contraseña Garanticon</h1>
      <Link to="/" className="mb-8">
        <Logo size="sm" />
      </Link>
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader>
          <CardTitle>Nueva contraseña</CardTitle>
          <CardDescription>Introduce tu nueva contraseña para acceder a tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent>
          {invalid ? (
            <div className="space-y-4 text-sm text-foreground">
              <p>El enlace de recuperación no es válido o ha caducado. Solicita uno nuevo.</p>
              <Link to="/forgot-password">
                <Button variant="outline" className="w-full">Solicitar nuevo enlace</Button>
              </Link>
            </div>
          ) : !ready ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nueva contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar contraseña</Label>
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-primary font-semibold text-primary-foreground hover:brightness-110"
              >
                {submitting ? <Loader2 className="animate-spin" /> : "Guardar contraseña"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default ResetPassword;
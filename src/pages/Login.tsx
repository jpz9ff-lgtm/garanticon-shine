import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/garanticon/Logo";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const { signIn, user, dealer, dealerError, loading, refreshDealer } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/dealer/dashboard", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!loading) {
      setSubmitting(false);
    }
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    let loginEmail = identifier.trim();
    if (loginEmail && !loginEmail.includes("@")) {
      try {
        const { data, error: fnErr } = await supabase.functions.invoke("resolve-username", {
          body: { username: loginEmail },
        });
        if (fnErr) throw fnErr;
        if (!data?.email) {
          setSubmitting(false);
          toast({ variant: "destructive", title: "Usuario no encontrado", description: "Revisa el nombre de usuario o usa tu email." });
          return;
        }
        loginEmail = data.email;
      } catch {
        setSubmitting(false);
        toast({ variant: "destructive", title: "Error de conexión", description: "Inténtalo de nuevo en unos segundos." });
        return;
      }
    }
    const { error } = await signIn(loginEmail, password);
    if (error) {
      setSubmitting(false);
      toast({ variant: "destructive", title: "No se ha podido iniciar sesión", description: error });
      return;
    }
    navigate("/dealer/dashboard", { replace: true });
  };

  const handleRetry = async () => {
    setSubmitting(true);
    await refreshDealer();
    setSubmitting(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-6 py-12">
      <h1 className="sr-only">Acceso Dealers Garanticon</h1>
      <Link to="/" className="mb-8">
        <Logo size="sm" />
      </Link>
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader>
          <CardTitle>Acceso Dealers</CardTitle>
          <CardDescription>Introduce tus credenciales para acceder a tu panel.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Usuario o email</Label>
              <Input
                id="identifier"
                type="text"
                autoComplete="username"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={submitting || loading}
              className="w-full rounded-full bg-primary font-semibold text-primary-foreground hover:brightness-110"
            >
              {submitting ? <Loader2 className="animate-spin" /> : "Entrar"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm">
            <Link to="/forgot-password" className="font-medium text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
          {!loading && user && !dealer && dealerError && (
            <div className="mt-4 space-y-3 rounded-md border border-border bg-muted/40 p-4 text-sm text-foreground">
              <p>{dealerError}</p>
              <Button type="button" variant="outline" className="w-full" onClick={handleRetry} disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin" /> : "Reintentar acceso"}
              </Button>
            </div>
          )}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿Problemas para entrar?{" "}
            <a href="mailto:contacto@garanticon.es" className="font-medium text-primary hover:underline">
              Contacta con garanticon.es
            </a>
          </p>
        </CardContent>
      </Card>
    </main>
  );
};

export default Login;
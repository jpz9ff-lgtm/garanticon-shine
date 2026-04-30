import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/garanticon/Logo";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      toast({ variant: "destructive", title: "No se pudo enviar el email", description: error.message });
      return;
    }
    setSent(true);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-6 py-12">
      <h1 className="sr-only">Recuperar contraseña Garanticon</h1>
      <Link to="/" className="mb-8">
        <Logo size="sm" />
      </Link>
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader>
          <CardTitle>Recuperar contraseña</CardTitle>
          <CardDescription>
            Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4">
              <p className="text-sm text-foreground">
                Si existe una cuenta asociada a <strong>{email}</strong>, recibirás un email con instrucciones en
                los próximos minutos. Revisa también la carpeta de spam.
              </p>
              <Link to="/login">
                <Button variant="outline" className="w-full">Volver al login</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-primary font-semibold text-primary-foreground hover:brightness-110"
              >
                {submitting ? <Loader2 className="animate-spin" /> : "Enviar enlace de recuperación"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Volver al login
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default ForgotPassword;
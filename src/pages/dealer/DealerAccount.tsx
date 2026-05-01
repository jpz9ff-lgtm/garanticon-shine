import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DealerHeader } from "@/components/dealer/DealerHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

const DealerAccount = () => {
  const { dealer, user, refreshDealer } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [cif, setCif] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingCreds, setSavingCreds] = useState(false);

  useEffect(() => {
    if (!dealer) return;
    setEmail(dealer.email ?? "");
    setNombreEmpresa(dealer.nombre_empresa ?? "");
    setCif(dealer.cif ?? "");
    // Fetch full row for username, telefono, direccion (not in context)
    supabase
      .from("dealers")
      .select("username, telefono, direccion")
      .eq("id", dealer.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setUsername(data.username ?? "");
          setTelefono(data.telefono ?? "");
          setDireccion(data.direccion ?? "");
        }
      });
  }, [dealer]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealer) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from("dealers")
      .update({
        nombre_empresa: nombreEmpresa.trim(),
        cif: cif.trim(),
        telefono: telefono.trim() || null,
        direccion: direccion.trim() || null,
      })
      .eq("id", dealer.id);
    setSavingProfile(false);
    if (error) {
      toast({ variant: "destructive", title: "No se pudo guardar", description: error.message });
      return;
    }
    await refreshDealer();
    toast({ title: "Datos actualizados" });
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (password && password !== confirmPassword) {
      toast({ variant: "destructive", title: "Las contraseñas no coinciden" });
      return;
    }
    if (password && password.length < 6) {
      toast({ variant: "destructive", title: "La contraseña debe tener al menos 6 caracteres" });
      return;
    }
    if (!currentPassword) {
      toast({ variant: "destructive", title: "Introduce tu contraseña actual" });
      return;
    }
    setSavingCreds(true);
    const payload: Record<string, string> = { currentPassword };
    if (username && username !== (dealer as { username?: string } | null)?.username) payload.username = username.trim();
    else if (username) payload.username = username.trim();
    if (email && email !== user.email) payload.email = email.trim();
    if (password) payload.password = password;

    const { data, error } = await supabase.functions.invoke("update-dealer-credentials", {
      body: payload,
    });
    setSavingCreds(false);
    if (error || (data && (data as { error?: string }).error)) {
      const msg = (data as { error?: string })?.error ?? error?.message ?? "Error al guardar";
      toast({ variant: "destructive", title: "No se pudo actualizar", description: msg });
      return;
    }
    setPassword("");
    setConfirmPassword("");
    setCurrentPassword("");
    await refreshDealer();
    toast({ title: "Credenciales actualizadas", description: "Los cambios ya están activos." });
  };

  return (
    <main className="min-h-screen bg-muted/20">
      <DealerHeader />
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <div>
          <h1 className="text-2xl font-bold">Mi cuenta</h1>
          <p className="text-sm text-muted-foreground">Gestiona los datos de tu empresa y tus credenciales de acceso.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Datos de la empresa</CardTitle>
            <CardDescription>Información mostrada en los contratos y comunicaciones.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="nombre_empresa">Nombre de la empresa</Label>
                <Input id="nombre_empresa" value={nombreEmpresa} onChange={(e) => setNombreEmpresa(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cif">CIF</Label>
                <Input id="cif" value={cif} onChange={(e) => setCif(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input id="direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={savingProfile}>
                  {savingProfile ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />}
                  Guardar datos
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Credenciales de acceso</CardTitle>
            <CardDescription>Cambia tu nombre de usuario, email o contraseña. Por seguridad, debes confirmar tu contraseña actual.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveCredentials} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">Nombre de usuario</Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Nueva contraseña (opcional)</Label>
                <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                <Input id="confirmPassword" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2 border-t pt-4">
                <Label htmlFor="currentPassword">Contraseña actual (obligatoria para guardar)</Label>
                <Input id="currentPassword" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={savingCreds}>
                  {savingCreds ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />}
                  Guardar credenciales
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default DealerAccount;
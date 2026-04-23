import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const inputCls =
  "h-12 rounded-xl border-border bg-background text-base transition-all focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";

export const ProfessionalsAccess = () => {
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

        <form className="rounded-3xl bg-card p-8 shadow-soft" onSubmit={(e) => e.preventDefault()}>
          <h3 className="text-2xl font-bold text-foreground">Log in</h3>
          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="professional-user" className="text-sm font-semibold">Usuario</Label>
              <Input id="professional-user" required className={inputCls} autoComplete="username" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="professional-password" className="text-sm font-semibold">Contraseña</Label>
              <Input id="professional-password" type="password" required className={inputCls} autoComplete="current-password" />
            </div>
            <Button type="submit" className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground hover:brightness-110">
              Entrar
            </Button>
            <Button type="button" variant="outline" className="h-12 w-full rounded-xl text-base font-semibold">
              Registrarme
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
};
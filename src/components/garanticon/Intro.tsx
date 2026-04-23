import { Gauge, MapPin, ShieldCheck, Wrench } from "lucide-react";

const highlights = [
  { icon: MapPin, label: "Cobertura nacional", text: "Más de 300 talleres colaboradores en toda España." },
  { icon: Wrench, label: "Tu taller de confianza", text: "También podemos gestionar la reparación con tu taller habitual." },
  { icon: Gauge, label: "Gestiones rápidas", text: "Procesos ágiles para que vuelvas a la carretera cuanto antes." },
  { icon: ShieldCheck, label: "Buenas coberturas", text: "Planes pensados para proteger lo importante de verdad." },
];

export const Intro = () => {
  return (
    <section className="bg-background px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="text-3xl font-bold leading-tight text-foreground md:text-5xl">
            Tu coche es una inversión. Nosotros la protegemos.
          </p>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">
            Garanticon ofrece planes de garantía para vehículos de ocasión con cobertura real,
            gestión ágil de siniestros y atención personalizada. Porque cuando algo falla, lo
            último que necesitas son complicaciones.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {highlights.map(({ icon: Icon, label, text }) => (
            <article key={label} className="rounded-2xl bg-card p-6 shadow-soft">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon size={24} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-foreground">{label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
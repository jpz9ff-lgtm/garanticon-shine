import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

const contactItems = [
  {
    label: "Teléfono",
    value: "+34 900 123 456",
    sub: "Atención al cliente",
    href: "tel:+34900123456",
    icon: Phone,
  },
  {
    label: "Email",
    value: "contacto@garanticon.es",
    sub: "Respondemos en menos de 24 h",
    href: "mailto:contacto@garanticon.es",
    icon: Mail,
  },
  {
    label: "WhatsApp",
    value: "+34 900 123 456",
    sub: "Más rápido y directo",
    href: "https://api.whatsapp.com/send?phone=34900123456&text=Hola%2C%20necesito%20asistencia%20con%20mi%20p%C3%B3liza%20Garanticon",
    icon: MessageCircle,
    accent: true,
  },
];

export const AssistanceContact = () => {
  return (
    <section id="contacto" className="bg-background px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-wide text-primary">Asistencia</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-foreground md:text-5xl">
            ¿Necesitas ayuda? Estamos a un clic
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Si has tenido una avería, comunícala a Garanticon en un plazo de{" "}
            <strong className="text-foreground">3 días hábiles</strong> desde que se produjo y{" "}
            <strong className="text-foreground">antes de iniciar cualquier reparación</strong>.
            Sin autorización previa no se generará obligación de pago.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {contactItems.map((item) => {
            const Icon = item.icon;
            const accent = item.accent;
            return (
              <a
                key={item.label}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="group rounded-2xl bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    accent ? "bg-whatsapp/15 text-whatsapp" : "bg-primary/15 text-primary"
                  }`}
                >
                  <Icon size={22} fill={accent ? "currentColor" : "none"} />
                </div>
                <p className="mt-5 text-sm font-semibold text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-lg font-bold text-foreground">{item.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.sub}</p>
              </a>
            );
          })}
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl bg-card p-6 shadow-soft">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Clock size={22} />
            </div>
            <p className="mt-5 text-sm font-semibold text-muted-foreground">Horario de atención</p>
            <p className="mt-2 text-base font-bold text-foreground">Lun–Jue 9:00–14:00 y 16:00–19:00</p>
            <p className="text-base font-bold text-foreground">Vie 9:00–14:00 y 15:30–18:00</p>
          </div>
          <div className="rounded-2xl bg-card p-6 shadow-soft">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <MapPin size={22} />
            </div>
            <p className="mt-5 text-sm font-semibold text-muted-foreground">Oficinas</p>
            <p className="mt-2 text-base font-bold text-foreground">
              Cabrick Automoción S.L. · CIF B01593748
            </p>
            <p className="text-base text-muted-foreground">
              Avda. Somosierra 12, 28703 San Sebastián de los Reyes (Madrid)
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
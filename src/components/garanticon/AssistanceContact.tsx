import { Mail, MessageCircle, Phone } from "lucide-react";

const contactItems = [
  { label: "Email", value: "hola@garanticon.es", href: "mailto:hola@garanticon.es", icon: Mail },
  { label: "Teléfono", value: "+34 900 123 456", href: "tel:+34900123456", icon: Phone },
];

export const AssistanceContact = () => {
  return (
    <section id="assistance" className="bg-background px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-wide text-primary">Asistencia</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-foreground md:text-5xl">
            ¿Necesitas ayuda? Aquí tienes lo necesario para contactarnos
          </h2>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {contactItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={item.href}
                className="rounded-2xl bg-card p-6 shadow-soft transition-transform hover:-translate-y-1"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icon size={22} />
                </div>
                <p className="mt-5 text-sm font-semibold text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-lg font-bold text-foreground">{item.value}</p>
              </a>
            );
          })}

          <a
            href="https://api.whatsapp.com/send?text=Hola%2C%20necesito%20asistencia%20con%20Garanticon"
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl bg-card p-6 shadow-soft transition-transform hover:-translate-y-1"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-whatsapp/15 text-whatsapp">
              <MessageCircle size={24} fill="currentColor" />
            </div>
            <p className="mt-5 text-sm font-semibold text-muted-foreground">WhatsApp</p>
            <p className="mt-2 text-lg font-bold text-foreground">+34 900 123 456</p>
          </a>
        </div>
      </div>
    </section>
  );
};
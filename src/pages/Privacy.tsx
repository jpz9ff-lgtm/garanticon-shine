import { Link } from "react-router-dom";
import { Footer } from "@/components/garanticon/Footer";
import { Navbar } from "@/components/garanticon/Navbar";

const Privacy = () => {
  const handleNavigate = (id: string) => {
    if (id === "hero") window.location.href = "/";
    if (id === "lookup") window.location.href = "/mi-poliza";
    if (id === "professionals") window.location.href = "/profesionales";
  };

  return (
    <main className="min-h-screen bg-background pt-24">
      <Navbar onNavigate={handleNavigate} />
      <section className="px-6 py-16">
        <article className="mx-auto max-w-3xl space-y-8 rounded-3xl bg-card p-8 shadow-soft md:p-12">
          <header>
            <p className="text-sm font-bold uppercase tracking-wide text-primary">Legal</p>
            <h1 className="mt-2 text-3xl font-bold text-foreground md:text-4xl">
              Política de privacidad
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Última actualización: mayo de 2026
            </p>
          </header>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Responsable del tratamiento</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Garanticon. Para cualquier consulta sobre tus datos puedes escribirnos a{" "}
              <a href="mailto:info@garanticon.es" className="font-semibold text-primary hover:underline">
                info@garanticon.es
              </a>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Datos que recopilamos</h2>
            <ul className="list-disc space-y-1 pl-6 text-base leading-relaxed text-muted-foreground">
              <li>Nombre y apellidos</li>
              <li>Teléfono</li>
              <li>Correo electrónico</li>
              <li>Matrícula del vehículo</li>
              <li>Número de póliza</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Finalidad</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Tratamos tus datos exclusivamente para gestionar las consultas relacionadas con tu garantía
              y atender tus solicitudes de asistencia.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Base legal</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Consentimiento del interesado (art. 6.1.a del Reglamento (UE) 2016/679 — RGPD).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Conservación</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Conservaremos tus datos durante un máximo de 3 años o hasta que retires tu consentimiento.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Tus derechos</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Puedes ejercer tus derechos de acceso, rectificación y supresión de tus datos, así como los
              demás derechos reconocidos por el RGPD, escribiendo a{" "}
              <a href="mailto:info@garanticon.es" className="font-semibold text-primary hover:underline">
                info@garanticon.es
              </a>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Cesión a terceros</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              No vendemos ni cedemos tus datos a terceros.
            </p>
          </section>

          <p className="pt-4 text-sm">
            <Link to="/" className="font-semibold text-primary hover:underline">
              ← Volver al inicio
            </Link>
          </p>
        </article>
      </section>
      <Footer />
    </main>
  );
};

export default Privacy;
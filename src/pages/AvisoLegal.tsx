import { Link } from "react-router-dom";
import { Footer } from "@/components/garanticon/Footer";
import { Navbar } from "@/components/garanticon/Navbar";

const AvisoLegal = () => {
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
              Aviso legal
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Última actualización: mayo de 2026
            </p>
          </header>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Datos identificativos</h2>
            <ul className="list-disc space-y-1 pl-6 text-base leading-relaxed text-muted-foreground">
              <li>Denominación social: Garanticon</li>
              <li>
                Email:{" "}
                <a href="mailto:info@garanticon.es" className="font-semibold text-primary hover:underline">
                  info@garanticon.es
                </a>
              </li>
              <li>Actividad: Servicios de garantía de vehículos de ocasión</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Objeto</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Este sitio web, garanticon.es, es propiedad de Garanticon y tiene como finalidad informar
              sobre sus servicios y permitir la gestión de garantías de vehículos.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Condiciones de uso</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              El acceso y uso de este sitio implica la aceptación de las presentes condiciones.
              Garanticon se reserva el derecho de modificar los contenidos sin previo aviso.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Propiedad intelectual</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Los contenidos, diseño y código de este sitio son propiedad de Garanticon o de sus
              licenciantes y están protegidos por la legislación de propiedad intelectual.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Exclusión de responsabilidad</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Garanticon no se hace responsable de los daños derivados del uso incorrecto del sitio ni
              de la indisponibilidad temporal del servicio.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Legislación aplicable</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Las presentes condiciones se rigen por la legislación española. Para cualquier
              controversia, las partes se someten a los juzgados y tribunales de Madrid.
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

export default AvisoLegal;
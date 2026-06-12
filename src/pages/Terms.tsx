import { Link } from "react-router-dom";
import { Footer } from "@/components/garanticon/Footer";
import { Navbar } from "@/components/garanticon/Navbar";

const Terms = () => {
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
              Términos y condiciones
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Última actualización: junio de 2026
            </p>
          </header>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">1. Prestador del servicio</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              El sitio web garanticon.es y el servicio de garantía comercializado bajo la marca
              <strong> Garanticon</strong> son titularidad de <strong>Cabrick Automoción S.L.</strong>,
              CIF B01593748, con domicilio en Avda. Somosierra 12, 28703 San Sebastián de los Reyes
              (Madrid). Contacto:{" "}
              <a href="mailto:info@garanticon.es" className="font-semibold text-primary hover:underline">
                info@garanticon.es
              </a>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">2. Objeto</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Las presentes condiciones regulan el uso del sitio web y la contratación, a través de
              los profesionales colaboradores (concesionarios y compraventas), de la garantía
              mecánica adicional Garanticon sobre vehículos de ocasión.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">3. Proceso de contratación</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              La garantía Garanticon se contrata en el punto de venta del vehículo a través de un
              profesional adherido. El profesional cumplimenta los datos del comprador y del
              vehículo, selecciona la modalidad (ESENCIAL, PLUS o ÉLITE) y emite el contrato de
              garantía, que es firmado por ambas partes. El comprador recibe una copia del contrato
              y puede consultar su póliza en el apartado <Link to="/mi-poliza" className="font-semibold text-primary hover:underline">Mi póliza</Link>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">4. Contrato de garantía</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              El alcance, coberturas, exclusiones, carencias, plazos y procedimiento de reclamación
              de la garantía se rigen por el clausulado del propio contrato firmado entre el
              comprador y Cabrick Automoción S.L. (Garanticon). En caso de discrepancia entre la
              información publicada en este sitio web y el contrato firmado, prevalecerá lo
              establecido en el contrato. [Revisar redacción definitiva con asesoría legal.]
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">5. Uso del sitio web</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              El usuario se compromete a hacer un uso lícito y diligente del sitio, a no introducir
              datos falsos y a no realizar actividades que puedan dañar, sobrecargar o afectar al
              normal funcionamiento del servicio. Cabrick Automoción S.L. podrá suspender el acceso
              en caso de uso indebido.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">6. Propiedad intelectual</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Todos los contenidos del sitio (textos, imágenes, marcas, logotipos, diseño y código)
              son titularidad de Cabrick Automoción S.L. o de sus licenciantes y están protegidos
              por la normativa vigente. Queda prohibida su reproducción total o parcial sin
              autorización expresa.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">7. Protección de datos</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              El tratamiento de los datos personales recogidos a través del sitio o derivados de la
              contratación de la garantía se rige por nuestra{" "}
              <Link to="/privacidad" className="font-semibold text-primary hover:underline">
                Política de privacidad
              </Link>{" "}
              y por la{" "}
              <Link to="/politica-de-cookies" className="font-semibold text-primary hover:underline">
                Política de cookies
              </Link>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">8. Responsabilidad</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Cabrick Automoción S.L. no se hace responsable de los daños derivados del uso
              incorrecto del sitio, de la imposibilidad temporal de acceso o de errores debidos a
              causas ajenas a su control. [Revisar exclusiones y límites de responsabilidad con
              asesoría legal.]
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">9. Ley aplicable y jurisdicción</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Las presentes condiciones y el contrato de garantía se rigen por la legislación
              española. Para cualquier controversia derivada de su interpretación o cumplimiento,
              las partes se someten a los Juzgados y Tribunales correspondientes al domicilio del
              consumidor, conforme a la normativa de defensa de consumidores y usuarios.
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

export default Terms;
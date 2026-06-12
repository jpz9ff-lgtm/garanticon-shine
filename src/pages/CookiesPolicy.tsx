import { Link } from "react-router-dom";
import { Footer } from "@/components/garanticon/Footer";
import { Navbar } from "@/components/garanticon/Navbar";

const CookiesPolicy = () => {
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
              Política de cookies
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Última actualización: junio de 2026
            </p>
          </header>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">¿Qué es una cookie?</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Una cookie es un pequeño archivo de texto que un sitio web guarda en tu dispositivo
              cuando lo visitas. Permite recordar información sobre tu visita (por ejemplo, tu
              elección de idioma o si ya has iniciado sesión), de forma que la navegación sea más
              cómoda y segura. Junto con las cookies, los sitios web pueden utilizar tecnologías
              equivalentes como el almacenamiento local del navegador (localStorage).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Cookies que utilizamos</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Garanticon solo utiliza cookies y almacenamiento técnicos, estrictamente necesarios
              para el funcionamiento del sitio y para mantener tu sesión cuando inicias sesión como
              profesional. <strong>No utilizamos cookies analíticas ni publicitarias de terceros.</strong>
            </p>
            <div className="overflow-x-auto pt-2">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-foreground">
                    <th className="py-2 pr-4 font-semibold">Nombre</th>
                    <th className="py-2 pr-4 font-semibold">Proveedor</th>
                    <th className="py-2 pr-4 font-semibold">Tipo</th>
                    <th className="py-2 pr-4 font-semibold">Caducidad</th>
                    <th className="py-2 font-semibold">Finalidad</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/60 align-top">
                    <td className="py-3 pr-4 font-mono text-xs">__cf_bm</td>
                    <td className="py-3 pr-4">Cloudflare</td>
                    <td className="py-3 pr-4">Técnica / seguridad</td>
                    <td className="py-3 pr-4">~30 minutos</td>
                    <td className="py-3">Distingue tráfico legítimo de bots para proteger el sitio.</td>
                  </tr>
                  <tr className="border-b border-border/60 align-top">
                    <td className="py-3 pr-4 font-mono text-xs">cookie_consent</td>
                    <td className="py-3 pr-4">Garanticon (propia)</td>
                    <td className="py-3 pr-4">Técnica</td>
                    <td className="py-3 pr-4">Persistente</td>
                    <td className="py-3">Guarda tu elección sobre el aviso de cookies (aceptado / rechazado).</td>
                  </tr>
                  <tr className="align-top">
                    <td className="py-3 pr-4 font-mono text-xs">sb-* (localStorage)</td>
                    <td className="py-3 pr-4">Supabase</td>
                    <td className="py-3 pr-4">Técnica</td>
                    <td className="py-3 pr-4">Hasta cerrar sesión</td>
                    <td className="py-3">Mantiene la sesión iniciada en el área de profesionales.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Cómo aceptar, rechazar o borrar las cookies</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Al entrar por primera vez en el sitio se muestra un aviso con los botones
              <strong> Aceptar</strong> y <strong>Rechazar</strong>. Como solo utilizamos cookies
              técnicas necesarias, en ambos casos el sitio sigue funcionando con normalidad; tu
              elección únicamente afecta a si volveremos a mostrarte el aviso.
            </p>
            <p className="text-base leading-relaxed text-muted-foreground">
              Puedes ver y borrar las cookies en cualquier momento desde la configuración de tu
              navegador:
            </p>
            <ul className="list-disc space-y-1 pl-6 text-base leading-relaxed text-muted-foreground">
              <li>Chrome: Configuración → Privacidad y seguridad → Cookies y otros datos de sitios.</li>
              <li>Firefox: Ajustes → Privacidad y seguridad → Cookies y datos del sitio.</li>
              <li>Safari: Preferencias → Privacidad → Administrar datos de sitios web.</li>
              <li>Edge: Configuración → Cookies y permisos del sitio.</li>
            </ul>
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

export default CookiesPolicy;
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CONSENT_EVENT, enforceConsent, getConsent, setConsent } from "@/lib/consent";

export const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Bloquea medición no necesaria en la navegación inicial y tras un rechazo previo.
    enforceConsent();
    setVisible(getConsent() === null);

    const onChange = () => {
      enforceConsent();
      setVisible(getConsent() === null);
    };
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  // Re-aplica el bloqueo en cada navegación interna.
  useEffect(() => {
    const id = window.setInterval(enforceConsent, 2000);
    return () => window.clearInterval(id);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-3xl rounded-2xl bg-card p-5 shadow-soft ring-1 ring-border md:inset-x-6 md:bottom-6 md:p-6"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm leading-relaxed text-foreground">
          Usamos cookies técnicas necesarias para el funcionamiento del sitio. La medición
          opcional solo se activa si la aceptas y nunca en tu área privada.{" "}
          <Link
            to="/politica-de-cookies"
            className="font-semibold text-foreground underline underline-offset-4 hover:text-primary"
          >
            Más información
          </Link>
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <Button
            onClick={() => setConsent("rejected")}
            variant="outline"
            className="h-10 rounded-xl border-border px-5 text-sm font-semibold"
          >
            Rechazar
          </Button>
          <Button
            onClick={() => setConsent("accepted")}
            className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:brightness-110"
          >
            Aceptar
          </Button>
        </div>
      </div>
    </div>
  );
};

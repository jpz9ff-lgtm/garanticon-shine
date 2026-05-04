import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "cookie_consent";

export const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // localStorage may be unavailable (SSR / privacy mode); ignore
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      // ignore
    }
    setVisible(false);
  };

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
          Usamos cookies técnicas necesarias para el funcionamiento del sitio. Sin datos de terceros.
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            to="/privacidad"
            className="text-sm font-semibold text-foreground underline underline-offset-4 hover:text-primary"
          >
            Más información
          </Link>
          <Button
            onClick={accept}
            className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:brightness-110"
          >
            Aceptar
          </Button>
        </div>
      </div>
    </div>
  );
};
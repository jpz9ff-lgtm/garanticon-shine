import { Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";

export const Footer = () => {
  return (
    <footer id="footer" className="bg-foreground px-6 py-16 text-background">
      <div className="mx-auto max-w-6xl">
        <Logo variant="dark" size="lg" />

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Phone size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-background/60">Teléfono</p>
              <p className="mt-1 font-semibold">+34 900 123 456</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Mail size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-background/60">Email</p>
              <p className="mt-1 font-semibold">info@garanticon.es</p>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-background/10 pt-8 text-center text-sm text-background/50">
          <p>© 2026 Garanticon. Todos los derechos reservados.</p>
          <p className="mt-2">
            <Link to="/privacidad" className="font-semibold text-background/70 hover:text-background">
              Política de privacidad
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};
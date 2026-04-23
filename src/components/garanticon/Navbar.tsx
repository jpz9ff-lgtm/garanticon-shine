import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavbarProps {
  onNavigate: (id: string) => void;
}

const links = [
  { id: "hero", label: "Inicio" },
  { id: "lookup", label: "Mi póliza" },
  { id: "assistance", label: "Asistencia" },
  { id: "professionals", label: "Profesionales" },
];

export const Navbar = ({ onNavigate }: NavbarProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (id: string) => {
    setOpen(false);
    onNavigate(id);
  };

  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/80 backdrop-blur-lg shadow-soft"
          : "bg-transparent",
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <button
          onClick={() => handleNav("hero")}
          className="transition-transform hover:scale-105"
          aria-label="Ir al inicio"
        >
          <Logo size="sm" variant={scrolled ? "light" : "dark"} />
        </button>

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <li key={l.id}>
              <button
                onClick={() => handleNav(l.id)}
                className={cn(
                  "text-sm font-medium transition-colors",
                  scrolled
                    ? "text-foreground/80 hover:text-primary"
                    : "text-background/90 hover:text-background",
                )}
              >
                {l.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="hidden md:block">
          <Button
            onClick={() => handleNav("lookup")}
            className="rounded-full bg-primary px-6 font-semibold text-primary-foreground shadow-soft transition-all hover:scale-105 hover:brightness-110"
          >
            Consultar
          </Button>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "rounded-md p-2 md:hidden transition-colors",
            scrolled ? "text-foreground" : "text-background",
          )}
          aria-label="Abrir menú"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-background/95 backdrop-blur-lg shadow-soft"
        >
          <ul className="flex flex-col px-6 py-4">
            {links.map((l) => (
              <li key={l.id}>
                <button
                  onClick={() => handleNav(l.id)}
                  className="block w-full py-3 text-left text-base font-medium text-foreground hover:text-primary"
                >
                  {l.label}
                </button>
              </li>
            ))}
            <li className="pt-2">
              <Button
                onClick={() => handleNav("lookup")}
                className="w-full rounded-full bg-primary font-semibold text-primary-foreground"
              >
                Consultar
              </Button>
            </li>
          </ul>
        </motion.div>
      )}
    </motion.header>
  );
};
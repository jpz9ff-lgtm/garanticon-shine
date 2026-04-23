import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { ArrowDown } from "lucide-react";
import heroVideo from "@/assets/hero.mp4";

interface HeroProps {
  onCta: () => void;
}

export const Hero = ({ onCta }: HeroProps) => {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-foreground px-6"
    >
      {/* Background video */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={heroVideo}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      {/* Dark overlay for legibility */}
      <div className="absolute inset-0 bg-foreground/55" />
      {/* Subtle brand glows on top of video */}
      <div className="pointer-events-none absolute inset-0 mix-blend-screen opacity-60">
        <div
          className="absolute -left-32 top-10 h-[480px] w-[480px] rounded-full blur-3xl animate-pulse-glow"
          style={{ background: "var(--gradient-glow-orange)" }}
        />
        <div
          className="absolute -right-32 bottom-10 h-[520px] w-[520px] rounded-full blur-3xl animate-pulse-glow"
          style={{ background: "var(--gradient-glow-purple)", animationDelay: "2s" }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <Logo size="xl" variant="dark" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="mt-6 max-w-2xl text-lg font-medium text-background/90 md:text-2xl"
        >
          Tu garantía, siempre contigo
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
          className="mt-10"
        >
          <Button
            onClick={onCta}
            size="lg"
            className="group h-14 rounded-full bg-primary px-8 text-base font-semibold text-primary-foreground shadow-soft transition-all duration-300 hover:scale-105 hover:bg-primary hover:brightness-110"
          >
            Consulta tu garantía
            <ArrowDown className="ml-1 transition-transform duration-300 group-hover:translate-y-1" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
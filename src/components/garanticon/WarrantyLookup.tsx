import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Car, ArrowRight } from "lucide-react";

export interface LookupResult {
  plate: string;
  policy: string;
}

interface Props {
  onResult: (r: LookupResult) => void;
  onRequestAssistance: () => void;
}

export const WarrantyLookup = ({ onResult, onRequestAssistance }: Props) => {
  const [plate, setPlate] = useState("");
  const [policy, setPolicy] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [progress, setProgress] = useState(0);

  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });

  const resultRef = useRef<HTMLDivElement>(null);
  const resultInView = useInView(resultRef, { once: true, margin: "-50px" });

  useEffect(() => {
    if (showResult && resultInView) {
      const t = setTimeout(() => setProgress(65), 200);
      return () => clearTimeout(t);
    }
  }, [showResult, resultInView]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate || !policy) return;
    setLoading(true);
    setShowResult(false);
    setTimeout(() => {
      setLoading(false);
      setShowResult(true);
      onResult({ plate, policy });
    }, 1500);
  };

  const tier: "MAX" | "BASIC" = "MAX";

  return (
    <section id="lookup" ref={sectionRef} className="bg-background px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center text-3xl font-bold text-foreground md:text-5xl"
        >
          Consulta el estado de tu póliza
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-12 rounded-3xl bg-card p-8 shadow-soft md:p-10"
        >
          <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="plate" className="text-sm font-semibold">Matrícula</Label>
              <Input
                id="plate"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                placeholder="1234 ABC"
                className="h-12 rounded-xl border-border bg-background text-base font-medium uppercase transition-all focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="policy" className="text-sm font-semibold">Número de póliza</Label>
              <Input
                id="policy"
                value={policy}
                onChange={(e) => setPolicy(e.target.value)}
                placeholder="POL-000000"
                className="h-12 rounded-xl border-border bg-background text-base font-medium transition-all focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
                required
              />
            </div>
            <div className="md:col-span-2">
              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground transition-all hover:scale-[1.02] hover:brightness-110 md:w-auto md:px-10"
              >
                {loading ? <><Loader2 className="mr-2 animate-spin" /> Consultando…</> : "Consultar"}
              </Button>
            </div>
          </form>
        </motion.div>

        <AnimatePresence>
          {showResult && (
            <motion.div
              ref={resultRef}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="mt-8 space-y-6 rounded-3xl bg-card p-8 shadow-soft md:p-10"
            >
              {/* Car info */}
              <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-background p-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary text-primary-foreground">
                  <Car size={26} />
                </div>
                <div className="grid flex-1 grid-cols-2 gap-3 text-sm md:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground">Marca</p>
                    <p className="font-semibold text-foreground">BMW</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Modelo</p>
                    <p className="font-semibold text-foreground">Serie 3</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Matrícula</p>
                    <p className="font-semibold text-foreground">{plate}</p>
                  </div>
                </div>
                {tier === "MAX" ? (
                  <span className="rounded-full gradient-primary px-4 py-1.5 text-xs font-bold tracking-wider text-primary-foreground shadow-soft">
                    MAX
                  </span>
                ) : (
                  <span className="rounded-full bg-muted px-4 py-1.5 text-xs font-bold tracking-wider text-muted-foreground">
                    BASIC
                  </span>
                )}
              </div>

              {/* Coverage timeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                  <span>Inicio: 01/01/2025</span>
                  <span className="font-bold text-foreground">{progress}% consumido</span>
                  <span>Fin: 01/01/2027</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "var(--gradient-primary)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.4, ease: "easeOut" }}
                  />
                </div>
                <p className="text-center text-sm font-medium text-foreground">
                  Te quedan <span className="font-bold text-primary">8 meses</span> de cobertura
                </p>
              </div>

              <Button
                onClick={onRequestAssistance}
                className="group h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground transition-all hover:scale-[1.02] hover:brightness-110"
              >
                Solicitar asistencia o dar parte
                <ArrowRight className="ml-1 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
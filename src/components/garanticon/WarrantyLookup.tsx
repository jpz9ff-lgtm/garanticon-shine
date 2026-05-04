import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Car, ArrowRight, Download, FileText } from "lucide-react";
import { format, differenceInDays, differenceInMonths } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { generateContractPdf, downloadBlob, type ContractData } from "@/lib/contract-pdf";
import { toast } from "@/components/ui/use-toast";

export interface LookupResult {
  plate: string;
  policy: string;
}

type WarrantyResp = ContractData & {
  id: string;
  estado: "activa" | "expirada" | "cancelada";
  limite_averia: number;
};

interface Props {
  onResult: (r: LookupResult) => void;
  onRequestAssistance: () => void;
  embedded?: boolean;
}

export const WarrantyLookup = ({ onResult, onRequestAssistance, embedded = false }: Props) => {
  const [plate, setPlate] = useState("");
  const [policy, setPolicy] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [warranty, setWarranty] = useState<WarrantyResp | null>(null);
  const [dealer, setDealer] = useState<{ nombre_empresa: string; cif: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });

  const resultRef = useRef<HTMLDivElement>(null);
  const resultInView = useInView(resultRef, { once: true, margin: "-50px" });

  useEffect(() => {
    if (warranty && resultInView) {
      const total = Math.max(
        1,
        differenceInDays(new Date(warranty.fecha_fin), new Date(warranty.fecha_inicio)),
      );
      const used = Math.max(0, differenceInDays(new Date(), new Date(warranty.fecha_inicio)));
      const pct = Math.min(100, Math.round((used / total) * 100));
      const t = setTimeout(() => setProgress(pct), 200);
      return () => clearTimeout(t);
    }
  }, [warranty, resultInView]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate || !policy || cooldown > 0) return;
    setLoading(true);
    setWarranty(null);
    setDealer(null);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.functions.invoke("lookup-warranty", {
        body: { matricula: plate, numero_poliza: policy },
      });
      if (error || data?.error) {
        setErrorMsg(data?.error ?? "No pudimos consultar tu póliza. Inténtalo de nuevo.");
      } else if (data?.warranty) {
        setWarranty(data.warranty);
        setDealer(data.dealer ?? null);
        onResult({ plate, policy });
      }
    } catch {
      setErrorMsg("No pudimos consultar tu póliza. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
      setCooldown(5);
    }
  };

  const handleDownload = async () => {
    if (!warranty) return;
    setDownloading(true);
    try {
      const blob = await generateContractPdf({
        ...warranty,
        vendedor_empresa: dealer?.nombre_empresa,
        vendedor_cif: dealer?.cif,
      });
      downloadBlob(blob, `Garanticon_${warranty.numero_poliza}.pdf`);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err?.message ?? "No se pudo generar el PDF" });
    } finally {
      setDownloading(false);
    }
  };

  const fmtDate = (d: string) => format(new Date(d), "dd MMM yyyy", { locale: es });
  const monthsLeft = warranty
    ? Math.max(0, differenceInMonths(new Date(warranty.fecha_fin), new Date()))
    : 0;

  return (
    <section id={embedded ? undefined : "lookup"} ref={sectionRef} className={embedded ? "bg-background" : "bg-background px-6 py-24"}>
      <div className="mx-auto max-w-3xl">
        {!embedded && (
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center text-3xl font-bold text-foreground md:text-5xl"
          >
            Consulta el estado de tu póliza
          </motion.h2>
        )}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className={`${embedded ? "mt-0" : "mt-12"} rounded-3xl bg-card p-8 shadow-soft md:p-10`}
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
                onChange={(e) => setPolicy(e.target.value.toUpperCase())}
                placeholder="GC-202601-0001"
                className="h-12 rounded-xl border-border bg-background text-base font-medium transition-all focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
                required
              />
            </div>
            <div className="md:col-span-2">
              <Button
                type="submit"
                disabled={loading || cooldown > 0}
                className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground transition-all hover:scale-[1.02] hover:brightness-110 md:w-auto md:px-10"
              >
                {loading
                  ? <><Loader2 className="mr-2 animate-spin" /> Consultando…</>
                  : cooldown > 0
                    ? `Espera ${cooldown}s…`
                    : "Consultar"}
              </Button>
              {errorMsg && (
                <p className="mt-3 text-sm font-medium text-destructive">{errorMsg}</p>
              )}
            </div>
          </form>
        </motion.div>

        <AnimatePresence>
          {warranty && (
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
                    <p className="font-semibold text-foreground">{warranty.vehiculo_marca}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Modelo</p>
                    <p className="font-semibold text-foreground">{warranty.vehiculo_modelo}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Matrícula</p>
                    <p className="font-semibold text-foreground">{warranty.matricula}</p>
                  </div>
                </div>
                {warranty.modalidad === "PLUS" ? (
                  <span className="rounded-full gradient-primary px-4 py-1.5 text-xs font-bold tracking-wider text-primary-foreground shadow-soft">
                    PLUS
                  </span>
                ) : (
                  <span className="rounded-full bg-purple-600 px-4 py-1.5 text-xs font-bold tracking-wider text-white">
                    BASIC
                  </span>
                )}
              </div>

              {/* Coverage timeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                  <span>Inicio: {fmtDate(warranty.fecha_inicio)}</span>
                  <span className="font-bold text-foreground">{progress}% consumido</span>
                  <span>Fin: {fmtDate(warranty.fecha_fin)}</span>
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
                  {warranty.estado === "activa"
                    ? <>Te quedan <span className="font-bold text-primary">{monthsLeft} meses</span> de cobertura</>
                    : warranty.estado === "expirada"
                      ? <>Esta garantía está <span className="font-bold text-destructive">expirada</span></>
                      : <>Esta garantía ha sido <span className="font-bold text-destructive">cancelada</span></>}
                </p>
              </div>

              {/* Resumen + cobertura */}
              <div className="grid gap-4 md:grid-cols-3 text-sm">
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-xs uppercase text-muted-foreground">Nº póliza</p>
                  <p className="mt-1 font-mono font-semibold">{warranty.numero_poliza}</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-xs uppercase text-muted-foreground">Límite por avería</p>
                  <p className="mt-1 text-lg font-bold text-primary">
                    {Number(warranty.limite_averia).toLocaleString("es-ES")} €
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-xs uppercase text-muted-foreground">Concesionario</p>
                  <p className="mt-1 font-semibold">{dealer?.nombre_empresa ?? "—"}</p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Button
                  onClick={handleDownload}
                  disabled={downloading}
                  variant="outline"
                  className="group h-12 w-full rounded-xl text-base font-semibold"
                >
                  {downloading
                    ? <><Loader2 className="mr-2 animate-spin" /> Generando PDF…</>
                    : <><Download className="mr-2" /> Descargar contrato (PDF)</>}
                </Button>
                <Button
                  onClick={onRequestAssistance}
                  className="group h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground transition-all hover:scale-[1.02] hover:brightness-110"
                >
                  Solicitar asistencia o dar parte
                  <ArrowRight className="ml-1 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>

              <details className="rounded-2xl border bg-background p-5 text-sm">
                <summary className="cursor-pointer font-semibold text-foreground">
                  <FileText className="mr-2 inline h-4 w-4" /> Ver condiciones y coberturas
                </summary>
                <div className="mt-4 space-y-3 leading-relaxed text-muted-foreground">
                  <p><strong>Modalidad {warranty.modalidad}</strong> — Límite por avería {Number(warranty.limite_averia).toLocaleString("es-ES")} € IVA inc. Límite total acumulado: precio de venta del vehículo.</p>
                  <p><strong>Carencia:</strong> 15 días naturales y 1.000 km desde la fecha de venta.</p>
                  <p><strong>Tramitación:</strong> comunica cualquier avería a Garanticon en 3 días hábiles desde su aparición. Ninguna reparación sin autorización previa generará obligación de pago.</p>
                  <p><strong>Mantenimiento obligatorio:</strong> revisiones cada 12 meses o 12.000 km (lo que antes ocurra), acreditadas con factura de taller.</p>
                  <p><strong>Ámbito:</strong> territorio nacional español (Península e Islas).</p>
                  <p>Para el detalle completo de exclusiones, piezas cubiertas y obligaciones, descarga el contrato en PDF.</p>
                </div>
              </details>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
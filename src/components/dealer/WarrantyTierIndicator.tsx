import { motion, AnimatePresence } from "framer-motion";
import { Check, ShieldCheck, ShieldQuestion, AlertTriangle, Lock } from "lucide-react";
import { calcularGarantia, TIERS, type WarrantyTier } from "@/lib/garanticon-validators";

type Props = {
  fechaMatriculacion: string;
  kmVenta: string;
};

const yearsSince = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
};

export const WarrantyTierIndicator = ({ fechaMatriculacion, kmVenta }: Props) => {
  const km = kmVenta === "" ? null : Number(kmVenta);
  const hasFecha = Boolean(fechaMatriculacion);
  const hasKm = km != null && !isNaN(km);
  const tier: WarrantyTier | null = calcularGarantia(fechaMatriculacion, km ?? undefined);
  const anios = hasFecha ? yearsSince(fechaMatriculacion) : null;

  // Estado vacío
  if (!hasFecha && !hasKm) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed bg-muted/40 p-4">
        <ShieldQuestion className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Rellena <strong>año de matriculación</strong> y <strong>kilómetros</strong> para detectar la garantía.
        </p>
      </div>
    );
  }

  // Datos parciales
  if (!tier) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
        <AlertTriangle className="h-6 w-6 text-amber-600" />
        <p className="text-sm font-medium text-amber-900">
          Faltan datos para determinar la garantía.
        </p>
      </div>
    );
  }

  // Aviso de proximidad al límite del tramo actual (solo si el tramo tiene límite)
  const nearLimit = (() => {
    if (tier.maxAnios == null || tier.maxKm == null || anios == null || km == null) return null;
    const aniosPct = anios / tier.maxAnios;
    const kmPct = km / tier.maxKm;
    if (aniosPct >= 0.9 || kmPct >= 0.9) return true;
    return false;
  })();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tier.tipo}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="rounded-xl p-5 text-white shadow-md"
        style={{ backgroundColor: tier.color }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-7 w-7" />
            <div>
              <p className="text-xs uppercase tracking-wider opacity-80">Garantía detectada</p>
              <p className="text-2xl font-extrabold leading-tight">{tier.nombre}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider opacity-80">Cobertura por avería</p>
            <p className="text-xl font-bold">{tier.cobertura.toLocaleString("es-ES")} €</p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-300" />
            <span>
              Antigüedad: <strong>{anios != null ? `${anios.toFixed(1)} años` : "—"}</strong>
              {tier.maxAnios != null && <> / límite {tier.maxAnios} años</>}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-300" />
            <span>
              Kilómetros: <strong>{km != null ? km.toLocaleString("es-ES") : "—"}</strong>
              {tier.maxKm != null && <> / límite {tier.maxKm.toLocaleString("es-ES")}</>}
            </span>
          </div>
        </div>

        {nearLimit && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
            <AlertTriangle className="h-3.5 w-3.5" />
            Este vehículo está cerca del límite de la garantía {tier.nombre}.
          </div>
        )}

        <div className="mt-3 flex items-center gap-1.5 text-xs opacity-80">
          <Lock className="h-3 w-3" /> Modalidad asignada automáticamente según los datos del vehículo.
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const TIER_DEFS = TIERS;
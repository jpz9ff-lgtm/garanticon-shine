import { z } from "zod";

const dniRegex = /^[0-9]{8}[A-Za-z]$/;
const nieRegex = /^[XYZxyz][0-9]{7}[A-Za-z]$/;
const cifRegex = /^[ABCDEFGHJNPQRSUVWabcdefghjnpqrsuvw][0-9]{7}[0-9A-Ja-j]$/;
const matriculaRegex = /^[0-9]{4}[A-Za-z]{3}$/; // formato moderno español
const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/; // VIN estándar: 17 caracteres, sin I, O, Q

export const isValidDni = (v: string) => {
  const s = v.trim();
  return dniRegex.test(s) || nieRegex.test(s) || cifRegex.test(s);
};
export const isValidMatricula = (v: string) => matriculaRegex.test(v.trim().replace(/\s|-/g, ""));
export const isValidVin = (v: string) => vinRegex.test(v.trim().toUpperCase());

export const compradorSchema = z.object({
  comprador_nombre: z.string().trim().min(2, "Obligatorio").max(150),
  comprador_dni: z.string().trim().refine(isValidDni, "DNI/NIE no válido"),
  comprador_telefono: z.string().trim().min(6, "Obligatorio").max(20),
  comprador_email: z.string().trim().email("Email no válido").max(255),
  comprador_direccion: z.string().trim().min(2, "Obligatorio").max(200),
  comprador_cp: z.string().trim().regex(/^[0-9]{5}$/, "CP no válido"),
  comprador_poblacion: z.string().trim().min(2, "Obligatorio").max(100),
  comprador_provincia: z.string().trim().min(2, "Obligatorio").max(100),
});

export const vehiculoSchema = z.object({
  vehiculo_marca: z.string().trim().min(1, "Obligatorio").max(60),
  vehiculo_modelo: z.string().trim().min(1, "Obligatorio").max(80),
  matricula: z.string().trim().refine(isValidMatricula, "Matrícula no válida (formato 1234ABC)"),
  bastidor: z.string().trim().refine(isValidVin, "El bastidor debe tener 17 caracteres (VIN, sin I, O, Q)"),
  fecha_matriculacion: z.string().min(4, "Obligatorio"),
  km_venta: z.coerce.number().int().min(0, "Inválido").max(2_000_000),
  precio_venta: z.coerce.number().min(0.01, "Obligatorio").max(1_000_000),
  combustible: z.enum(["Gasolina", "Diésel", "Híbrido", "Eléctrico"]),
  tipo_cambio: z.enum(["Manual", "Automático"]),
  traccion_4x4: z.boolean().default(false),
});

export const garantiaSchema = z.object({
  modalidad: z.enum(["ELITE", "PLUS", "ESENCIAL", "BASIC"]),
  fecha_venta: z.string().min(4, "Obligatorio"),
  fecha_inicio: z.string().min(4, "Obligatorio"),
  fecha_fin: z.string().min(4, "Obligatorio"),
});

/**
 * Nuevas modalidades (3 tramos):
 *  - ÉLITE:    ≤ 8 años  y ≤ 120.000 km   → 4.500 €
 *  - PLUS:     ≤ 12 años y ≤ 180.000 km   → 3.000 €
 *  - ESENCIAL: resto                       → 2.000 €
 */
export type Modalidad = "ELITE" | "PLUS" | "ESENCIAL" | "BASIC";

export type WarrantyTier = {
  tipo: "ELITE" | "PLUS" | "ESENCIAL";
  nombre: string;
  cobertura: number;
  color: string;
  maxAnios: number | null;
  maxKm: number | null;
};

export const TIERS: Record<"ELITE" | "PLUS" | "ESENCIAL", WarrantyTier> = {
  ELITE: { tipo: "ELITE", nombre: "ÉLITE", cobertura: 4500, color: "#F97316", maxAnios: 8, maxKm: 120000 },
  PLUS: { tipo: "PLUS", nombre: "PLUS", cobertura: 3500, color: "#7C3AED", maxAnios: 12, maxKm: 180000 },
  ESENCIAL: { tipo: "ESENCIAL", nombre: "ESENCIAL", cobertura: 2500, color: "#1C1C2E", maxAnios: null, maxKm: null },
};

/** Determina la modalidad según antigüedad y km. Devuelve null si faltan datos. */
export const calcularGarantia = (
  fechaMatriculacion: string,
  kmVenta: number | null | undefined,
): WarrantyTier | null => {
  if (!fechaMatriculacion || kmVenta == null || isNaN(Number(kmVenta))) return null;
  const matric = new Date(fechaMatriculacion);
  if (isNaN(matric.getTime())) return null;
  const antiguedad = (Date.now() - matric.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  const km = Number(kmVenta);
  if (antiguedad <= 8 && km <= 120000) return TIERS.ELITE;
  if (antiguedad <= 12 && km <= 180000) return TIERS.PLUS;
  return TIERS.ESENCIAL;
};

export const limiteAveriaFor = (modalidad: Modalidad) => {
  if (modalidad === "ELITE") return 4500;
  if (modalidad === "PLUS") return 3500;
  if (modalidad === "ESENCIAL") return 2500;
  return 2500; // legacy BASIC
};

export const tierColor = (modalidad: Modalidad) => {
  if (modalidad === "ELITE") return "#F97316";
  if (modalidad === "PLUS") return "#7C3AED";
  return "#1C1C2E"; // ESENCIAL / BASIC
};

/** Mantiene compat retro con código existente. */
export const isPlusEligible = (fechaMatriculacion: string, kmVenta: number) => {
  const t = calcularGarantia(fechaMatriculacion, kmVenta);
  return t?.tipo === "ELITE" || t?.tipo === "PLUS";
};
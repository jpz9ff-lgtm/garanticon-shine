import { z } from "zod";

const dniRegex = /^[0-9]{8}[A-Za-z]$/;
const nieRegex = /^[XYZxyz][0-9]{7}[A-Za-z]$/;
const matriculaRegex = /^[0-9]{4}[A-Za-z]{3}$/; // formato moderno español
const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/; // VIN estándar: 17 caracteres, sin I, O, Q

export const isValidDni = (v: string) => dniRegex.test(v.trim()) || nieRegex.test(v.trim());
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
  modalidad: z.enum(["PLUS", "BASIC"]),
  fecha_venta: z.string().min(4, "Obligatorio"),
  fecha_inicio: z.string().min(4, "Obligatorio"),
  fecha_fin: z.string().min(4, "Obligatorio"),
});

/** PLUS solo si el vehículo tiene < 15 años Y < 220.000 km */
export const isPlusEligible = (fechaMatriculacion: string, kmVenta: number) => {
  if (!fechaMatriculacion) return false;
  const matric = new Date(fechaMatriculacion);
  if (isNaN(matric.getTime())) return false;
  const years = (Date.now() - matric.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return years < 15 && kmVenta < 220000;
};

export const limiteAveriaFor = (modalidad: "PLUS" | "BASIC") =>
  modalidad === "PLUS" ? 5000 : 2500;
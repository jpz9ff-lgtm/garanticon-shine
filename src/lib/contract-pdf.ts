import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { format } from "date-fns";

export type ContractData = {
  numero_poliza: string;
  modalidad: "PLUS" | "BASIC";
  fecha_venta: string;
  fecha_inicio: string;
  fecha_fin: string;
  comprador_nombre: string;
  comprador_dni: string;
  comprador_telefono?: string | null;
  comprador_email?: string | null;
  comprador_direccion?: string | null;
  comprador_cp?: string | null;
  comprador_poblacion?: string | null;
  comprador_provincia?: string | null;
  vehiculo_marca: string;
  vehiculo_modelo: string;
  matricula: string;
  bastidor?: string | null;
  fecha_matriculacion?: string | null;
  km_venta?: number | null;
  precio_venta?: number | null;
  combustible?: string | null;
  tipo_cambio?: string | null;
  traccion_4x4: boolean;
  vendedor_empresa?: string | null;
  vendedor_cif?: string | null;
};

const fmtDate = (d?: string | null) => (d ? format(new Date(d), "dd/MM/yyyy") : "");

/**
 * Estampa los datos sobre la plantilla oficial PDF (4 páginas).
 * Página 1: portada PLUS. Página 2: condiciones PLUS.
 * Página 3: portada BASIC. Página 4: condiciones BASIC.
 * Conservamos la portada de la modalidad elegida + sus condiciones.
 * Coordenadas en puntos PDF (origen: esquina inferior izquierda). A4 = 595 x 842.
 */
export async function generateContractPdf(data: ContractData): Promise<Blob> {
  const templateBytes = await fetch("/contracts/GARANTICON_Contrato_Plantilla.pdf")
    .then((r) => {
      if (!r.ok) throw new Error("No se pudo cargar la plantilla del contrato");
      return r.arrayBuffer();
    });

  const src = await PDFDocument.load(templateBytes);
  const out = await PDFDocument.create();
  const font = await out.embedFont(StandardFonts.Helvetica);
  const fontBold = await out.embedFont(StandardFonts.HelveticaBold);

  // Copiamos solo las páginas de la modalidad elegida
  const pageIdx = data.modalidad === "PLUS" ? [0, 1] : [2, 3];
  const copied = await out.copyPages(src, pageIdx);
  copied.forEach((p) => out.addPage(p));

  const cover = out.getPage(0);
  const { height } = cover.getSize();

  const text = (
    str: string,
    x: number,
    yFromTop: number,
    opts: { size?: number; bold?: boolean; color?: [number, number, number] } = {},
  ) => {
    const size = opts.size ?? 9;
    const f = opts.bold ? fontBold : font;
    const c = opts.color ?? [0.1, 0.1, 0.1];
    cover.drawText(str ?? "", {
      x,
      y: height - yFromTop,
      size,
      font: f,
      color: rgb(c[0], c[1], c[2]),
    });
  };

  // Truncar para no desbordar
  const t = (s: string | null | undefined, max = 60) =>
    !s ? "" : s.length > max ? s.slice(0, max - 1) + "…" : s;

  // ---------- Cabecera ----------
  // Nº certificado (esquina sup. derecha, debajo de "Nº CERTIFICADO")
  text(data.numero_poliza, 445, 78, { size: 10, bold: true, color: [0.93, 0.35, 0.05] });

  // Fechas (Fecha venta / Inicio / Fin) — fila bajo MODALIDAD
  text(fmtDate(data.fecha_venta), 195, 158, { size: 10, bold: true });
  text(fmtDate(data.fecha_inicio), 350, 158, { size: 10, bold: true });
  text(fmtDate(data.fecha_fin), 500, 158, { size: 10, bold: true });

  // ---------- Datos del comprador ----------
  text(t(data.comprador_nombre, 70), 60, 252);
  text(t(data.comprador_dni, 20), 430, 252);

  text(t(data.comprador_telefono, 25), 60, 282);
  text(t(data.comprador_email, 50), 250, 282);

  text(t(data.comprador_direccion, 80), 60, 312);
  text(t(data.comprador_cp, 10), 510, 312);

  text(t(data.comprador_poblacion, 40), 60, 342);
  text(t(data.comprador_provincia, 40), 350, 342);

  // ---------- Datos del vehículo ----------
  text(t(`${data.vehiculo_marca} ${data.vehiculo_modelo}`, 60), 60, 397);
  text(t(data.matricula, 15), 430, 397);

  text(t(data.bastidor, 25), 60, 427);
  text(fmtDate(data.fecha_matriculacion), 320, 427);
  text(data.km_venta != null ? `${data.km_venta.toLocaleString("es-ES")} km` : "", 480, 427);

  text(
    data.precio_venta != null ? `${Number(data.precio_venta).toLocaleString("es-ES")} €` : "",
    60,
    457,
  );
  text(t(data.combustible, 15), 220, 457);
  text(t(data.tipo_cambio, 15), 380, 457);
  text(data.traccion_4x4 ? "Sí" : "No", 510, 457);

  // Marcar checkboxes con una "X"
  const X = (x: number, y: number) =>
    text("X", x, y, { size: 12, bold: true, color: [0.93, 0.35, 0.05] });

  // Coordenadas aproximadas de las casillas Combustible
  const fuelMap: Record<string, number> = { Gasolina: 178, Diésel: 244, Híbrido: 308, Eléctrico: 372 };
  const fuelX = fuelMap[data.combustible || ""];
  if (fuelX) X(fuelX, 487);

  // Cambio
  if (data.tipo_cambio === "Manual") X(488, 487);
  if (data.tipo_cambio === "Automático") X(545, 487);

  // ---------- Datos del vendedor ----------
  text(t(data.vendedor_empresa, 70), 60, 597);
  text(t(data.vendedor_cif, 20), 430, 597);

  const bytes = await out.save();
  // Copia a un ArrayBuffer "limpio" para máxima compatibilidad con Blob
  const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return new Blob([ab], { type: "application/pdf" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.target = "_self";
  document.body.appendChild(a);
  a.click();
  // Pequeño retraso antes de limpiar para evitar cancelaciones en algunos navegadores
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}
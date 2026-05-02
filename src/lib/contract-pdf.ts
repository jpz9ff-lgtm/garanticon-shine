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

const fmtDate = (d?: string | null) => {
  if (!d) return "";
  try {
    return format(new Date(d), "dd/MM/yyyy");
  } catch {
    return "";
  }
};

/**
 * Estampa los datos sobre la plantilla oficial (4 páginas: PLUS portada, PLUS condiciones,
 * BASIC portada, BASIC condiciones). Usamos las 2 páginas correspondientes a la modalidad.
 *
 * Coordenadas calibradas sobre A4 595x842pt. Origen pdf-lib: esquina inferior izquierda.
 * Para mantener legibilidad escribimos en píxeles "yFromTop" y luego convertimos.
 */
export async function generateContractPdf(data: ContractData): Promise<Blob> {
  console.log("[contract-pdf] data", data);

  const templateBytes = await fetch("/contracts/GARANTICON_Contrato_Plantilla.pdf").then((r) => {
    if (!r.ok) throw new Error("No se pudo cargar la plantilla del contrato");
    return r.arrayBuffer();
  });

  const src = await PDFDocument.load(templateBytes);
  const out = await PDFDocument.create();
  const font = await out.embedFont(StandardFonts.Helvetica);
  const fontBold = await out.embedFont(StandardFonts.HelveticaBold);

  // PLUS: páginas 0,1 · BASIC: páginas 2,3
  const pageIdx = data.modalidad === "PLUS" ? [0, 1] : [2, 3];
  const copied = await out.copyPages(src, pageIdx);
  copied.forEach((p) => out.addPage(p));

  const cover = out.getPage(0);
  const { width: W, height: H } = cover.getSize();

  const ORANGE: [number, number, number] = [0.93, 0.35, 0.05];
  const DARK: [number, number, number] = [0.1, 0.1, 0.1];

  const text = (
    str: string,
    x: number,
    yFromTop: number,
    opts: { size?: number; bold?: boolean; color?: [number, number, number] } = {},
  ) => {
    if (!str) return;
    const size = opts.size ?? 9;
    const f = opts.bold ? fontBold : font;
    const c = opts.color ?? DARK;
    cover.drawText(String(str), {
      x,
      y: H - yFromTop,
      size,
      font: f,
      color: rgb(c[0], c[1], c[2]),
    });
  };

  // Trunca para no desbordar campos
  const t = (s: string | null | undefined, max = 60) =>
    !s ? "" : s.length > max ? s.slice(0, max - 1) + "…" : String(s);

  // ============= CABECERA =============
  // Nº certificado (esquina sup. derecha, debajo de "Nº CERTIFICADO")
  text(data.numero_poliza, W - 130, 50, { size: 10, bold: true, color: ORANGE });

  // ============= FECHAS =============
  // Fila bajo etiquetas FECHA VENTA / INICIO / FIN (líneas grises)
  text(fmtDate(data.fecha_venta), 130, 188, { size: 10, bold: true });
  text(fmtDate(data.fecha_inicio), 380, 188, { size: 10, bold: true });
  text(fmtDate(data.fecha_fin), 625, 188, { size: 10, bold: true });

  // ============= DATOS COMPRADOR =============
  // Nombre / DNI
  text(t(data.comprador_nombre, 60), 60, 305);
  text(t(data.comprador_dni, 18), 580, 305);

  // Teléfono / Email
  text(t(data.comprador_telefono, 22), 60, 350);
  text(t(data.comprador_email, 50), 320, 350);

  // Dirección / CP
  text(t(data.comprador_direccion, 75), 60, 393);
  text(t(data.comprador_cp, 8), 600, 393);

  // Población / Provincia
  text(t(data.comprador_poblacion, 38), 60, 437);
  text(t(data.comprador_provincia, 38), 480, 437);

  // ============= DATOS VEHÍCULO =============
  // Marca y modelo / Matrícula
  text(t(`${data.vehiculo_marca ?? ""} ${data.vehiculo_modelo ?? ""}`.trim(), 55), 60, 540);
  text(t(data.matricula, 12), 580, 540);

  // Nº Bastidor / Fecha 1ª matric. / Km en venta
  text(t(data.bastidor, 22), 60, 583);
  text(fmtDate(data.fecha_matriculacion), 405, 583);
  text(
    data.km_venta != null ? `${Number(data.km_venta).toLocaleString("es-ES")}` : "",
    605,
    583,
  );

  // Precio venta · (combustible/cambio/4x4 sólo se marcan con X abajo)
  text(
    data.precio_venta != null ? `${Number(data.precio_venta).toLocaleString("es-ES")} €` : "",
    60,
    627,
  );

  // ============= CHECKBOXES =============
  const X = (x: number, y: number) =>
    text("X", x, y, { size: 12, bold: true, color: ORANGE });

  // Combustible: Gasolina, Diésel, Híbrido, Eléctrico (línea de checkboxes)
  const fuelMap: Record<string, number> = {
    Gasolina: 161,
    "Diésel": 240,
    "Híbrido": 313,
    "Eléctrico": 387,
  };
  const fx = fuelMap[data.combustible || ""];
  if (fx) X(fx, 670);

  // Cambio: Manual, Automático
  if (data.tipo_cambio === "Manual") X(486, 670);
  if (data.tipo_cambio === "Automático") X(573, 670);

  // ============= DATOS VENDEDOR =============
  text(t(data.vendedor_empresa, 60), 60, 798);
  text(t(data.vendedor_cif, 18), 580, 798);

  // (No estampamos firma — espacio reservado para firma manuscrita)

  const bytes = await out.save();
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  return new Blob([ab], { type: "application/pdf" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

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
  text(data.numero_poliza, W - 130, 78, { size: 10, bold: true, color: ORANGE });

  // ============= FECHAS =============
  // Sobre las líneas grises bajo "FECHA DE VENTA / INICIO DE COBERTURA / FIN DE COBERTURA"
  text(fmtDate(data.fecha_venta), 95, 138, { size: 10, bold: true });
  text(fmtDate(data.fecha_inicio), 290, 138, { size: 10, bold: true });
  text(fmtDate(data.fecha_fin), 488, 138, { size: 10, bold: true });

  // ============= DATOS COMPRADOR =============
  text(t(data.comprador_nombre, 55), 60, 230);
  text(t(data.comprador_dni, 18), 430, 230);

  text(t(data.comprador_telefono, 22), 60, 257);
  text(t(data.comprador_email, 45), 240, 257);

  text(t(data.comprador_direccion, 75), 60, 283);
  text(t(data.comprador_cp, 8), 460, 283);

  text(t(data.comprador_poblacion, 38), 60, 309);
  text(t(data.comprador_provincia, 38), 360, 309);

  // ============= DATOS VEHÍCULO =============
  text(t(`${data.vehiculo_marca ?? ""} ${data.vehiculo_modelo ?? ""}`.trim(), 55), 60, 342);
  text(t(data.matricula, 12), 430, 342);

  text(t(data.bastidor, 22), 60, 366);
  text(fmtDate(data.fecha_matriculacion), 320, 366);
  text(
    data.km_venta != null ? `${Number(data.km_venta).toLocaleString("es-ES")}` : "",
    490,
    366,
  );

  text(
    data.precio_venta != null ? `${Number(data.precio_venta).toLocaleString("es-ES")} €` : "",
    60,
    392,
  );
  text(data.traccion_4x4 ? "Sí" : "No", 510, 392);

  // ============= CHECKBOXES =============
  const X = (x: number, y: number) =>
    text("X", x, y, { size: 12, bold: true, color: ORANGE });

  // Línea checkboxes (y≈408pt según plantilla)
  const fuelMap: Record<string, number> = {
    Gasolina: 117,
    "Diésel": 178,
    "Híbrido": 240,
    "Eléctrico": 302,
  };
  const fx = fuelMap[data.combustible || ""];
  if (fx) X(fx, 408);

  if (data.tipo_cambio === "Manual") X(425, 408);
  if (data.tipo_cambio === "Automático") X(491, 408);

  // ============= DATOS VENDEDOR =============
  text(t(data.vendedor_empresa, 60), 60, 528);
  text(t(data.vendedor_cif, 18), 430, 528);

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

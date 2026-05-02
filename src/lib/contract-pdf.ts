import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from "pdf-lib";
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
  if (!d) return "—";
  try {
    return format(new Date(d), "dd/MM/yyyy");
  } catch {
    return "—";
  }
};

const fmtNum = (n?: number | null, suffix = "") =>
  n == null || isNaN(Number(n)) ? "—" : `${Number(n).toLocaleString("es-ES")}${suffix}`;

const safe = (s?: string | null) => (s == null || s === "" ? "—" : String(s));

const PRIMARY: [number, number, number] = [0.93, 0.35, 0.05]; // naranja Garanticon
const PURPLE: [number, number, number] = [0.45, 0.25, 0.7];
const DARK: [number, number, number] = [0.12, 0.12, 0.15];
const GREY: [number, number, number] = [0.45, 0.45, 0.5];
const LIGHT: [number, number, number] = [0.93, 0.93, 0.95];

export async function generateContractPdf(data: ContractData): Promise<Blob> {
  console.log("[contract-pdf] data", data);

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const A4 = { w: 595.28, h: 841.89 };
  const margin = 40;
  const accent = data.modalidad === "PLUS" ? PRIMARY : PURPLE;

  const page = doc.addPage([A4.w, A4.h]);

  const drawText = (
    p: PDFPage,
    str: string,
    x: number,
    yFromTop: number,
    opts: { size?: number; bold?: boolean; color?: [number, number, number]; font?: PDFFont } = {},
  ) => {
    const size = opts.size ?? 9.5;
    const f = opts.font ?? (opts.bold ? bold : font);
    const c = opts.color ?? DARK;
    p.drawText(str ?? "", { x, y: A4.h - yFromTop, size, font: f, color: rgb(c[0], c[1], c[2]) });
  };

  const rect = (
    p: PDFPage,
    x: number,
    yFromTop: number,
    w: number,
    h: number,
    color: [number, number, number],
    border?: [number, number, number],
  ) => {
    p.drawRectangle({
      x,
      y: A4.h - yFromTop - h,
      width: w,
      height: h,
      color: rgb(color[0], color[1], color[2]),
      borderColor: border ? rgb(border[0], border[1], border[2]) : undefined,
      borderWidth: border ? 0.5 : 0,
    });
  };

  // ---------- HEADER ----------
  rect(page, 0, 0, A4.w, 90, accent);
  drawText(page, "GARANTICON", margin, 38, { size: 22, bold: true, color: [1, 1, 1] });
  drawText(page, "Contrato de Garantía Mecánica", margin, 60, { size: 11, color: [1, 1, 1] });

  drawText(page, "Nº PÓLIZA", A4.w - margin - 150, 30, { size: 8, bold: true, color: [1, 1, 1] });
  drawText(page, data.numero_poliza ?? "—", A4.w - margin - 150, 48, {
    size: 14,
    bold: true,
    color: [1, 1, 1],
  });
  drawText(page, `MODALIDAD ${data.modalidad}`, A4.w - margin - 150, 70, {
    size: 9,
    bold: true,
    color: [1, 1, 1],
  });

  // ---------- VIGENCIA ----------
  let y = 115;
  rect(page, margin, y, A4.w - margin * 2, 50, LIGHT);
  const colW = (A4.w - margin * 2) / 3;
  ["FECHA DE VENTA", "INICIO COBERTURA", "FIN COBERTURA"].forEach((label, i) => {
    drawText(page, label, margin + 12 + colW * i, y + 16, { size: 8, color: GREY, bold: true });
  });
  drawText(page, fmtDate(data.fecha_venta), margin + 12, y + 36, { size: 12, bold: true });
  drawText(page, fmtDate(data.fecha_inicio), margin + 12 + colW, y + 36, { size: 12, bold: true });
  drawText(page, fmtDate(data.fecha_fin), margin + 12 + colW * 2, y + 36, { size: 12, bold: true });

  // ---------- helper sección ----------
  const sectionTitle = (title: string, yPos: number) => {
    rect(page, margin, yPos, A4.w - margin * 2, 22, accent);
    drawText(page, title, margin + 12, yPos + 16, { size: 10, bold: true, color: [1, 1, 1] });
  };

  const field = (label: string, value: string, x: number, yPos: number, width: number) => {
    drawText(page, label.toUpperCase(), x, yPos, { size: 7.5, color: GREY, bold: true });
    // recortar si excede el ancho
    let txt = value ?? "—";
    const maxChars = Math.floor(width / 5);
    if (txt.length > maxChars) txt = txt.slice(0, maxChars - 1) + "…";
    drawText(page, txt, x, yPos + 14, { size: 10, bold: true });
  };

  // ---------- COMPRADOR ----------
  y = 185;
  sectionTitle("DATOS DEL COMPRADOR", y);
  y += 38;
  const col1 = margin + 8;
  const col2 = margin + (A4.w - margin * 2) / 2 + 8;
  const fullW = A4.w - margin * 2 - 16;
  const halfW = fullW / 2 - 8;

  field("Nombre / Razón social", safe(data.comprador_nombre), col1, y, fullW);
  y += 32;
  field("DNI / NIF", safe(data.comprador_dni), col1, y, halfW);
  field("Teléfono", safe(data.comprador_telefono), col2, y, halfW);
  y += 32;
  field("Email", safe(data.comprador_email), col1, y, fullW);
  y += 32;
  field("Dirección", safe(data.comprador_direccion), col1, y, fullW);
  y += 32;
  field("Código postal", safe(data.comprador_cp), col1, y, halfW);
  field("Población", safe(data.comprador_poblacion), col2, y, halfW);
  y += 32;
  field("Provincia", safe(data.comprador_provincia), col1, y, fullW);

  // ---------- VEHÍCULO ----------
  y += 38;
  sectionTitle("DATOS DEL VEHÍCULO", y);
  y += 38;
  field("Marca", safe(data.vehiculo_marca), col1, y, halfW);
  field("Modelo", safe(data.vehiculo_modelo), col2, y, halfW);
  y += 32;
  field("Matrícula", safe(data.matricula), col1, y, halfW);
  field("Nº bastidor (VIN)", safe(data.bastidor), col2, y, halfW);
  y += 32;
  field("Fecha 1ª matriculación", fmtDate(data.fecha_matriculacion), col1, y, halfW);
  field("Kilómetros en venta", fmtNum(data.km_venta, " km"), col2, y, halfW);
  y += 32;
  field("Precio de venta", fmtNum(data.precio_venta, " €"), col1, y, halfW);
  field("Combustible", safe(data.combustible), col2, y, halfW);
  y += 32;
  field("Tipo de cambio", safe(data.tipo_cambio), col1, y, halfW);
  field("Tracción 4x4", data.traccion_4x4 ? "Sí" : "No", col2, y, halfW);

  // ---------- VENDEDOR ----------
  y += 38;
  sectionTitle("DATOS DEL VENDEDOR", y);
  y += 38;
  field("Empresa", safe(data.vendedor_empresa), col1, y, fullW);
  y += 32;
  field("CIF", safe(data.vendedor_cif), col1, y, fullW);

  // ---------- COBERTURA ----------
  y += 38;
  rect(page, margin, y, A4.w - margin * 2, 60, LIGHT);
  drawText(page, "LÍMITE POR AVERÍA", margin + 12, y + 18, { size: 8, bold: true, color: GREY });
  drawText(
    page,
    data.modalidad === "PLUS" ? "5.000 € IVA inc." : "2.500 € IVA inc.",
    margin + 12,
    y + 40,
    { size: 14, bold: true, color: accent },
  );
  drawText(page, "LÍMITE TOTAL ACUMULADO", margin + 280, y + 18, {
    size: 8,
    bold: true,
    color: GREY,
  });
  drawText(page, fmtNum(data.precio_venta, " €"), margin + 280, y + 40, {
    size: 14,
    bold: true,
    color: accent,
  });

  // ---------- FOOTER ----------
  drawText(
    page,
    "Garanticon — Documento generado automáticamente. Consulta condiciones completas en garanticon.es",
    margin,
    A4.h - 30,
    { size: 7.5, color: GREY },
  );

  // ---------- PÁGINA 2: CONDICIONES ----------
  const page2 = doc.addPage([A4.w, A4.h]);
  rect(page2, 0, 0, A4.w, 60, accent);
  drawText(page2, "CONDICIONES GENERALES", margin, 38, { size: 16, bold: true, color: [1, 1, 1] });

  const conditions = [
    {
      t: `MODALIDAD ${data.modalidad}`,
      b:
        data.modalidad === "PLUS"
          ? "Cobertura para vehículos con menos de 15 años y menos de 220.000 km. Límite por avería: 5.000 € IVA inc."
          : "Cobertura para vehículos con 15 años o más, o con 220.000 km o más. Límite por avería: 2.500 € IVA inc.",
    },
    { t: "CARENCIA", b: "15 días naturales y 1.000 km desde la fecha de venta del vehículo." },
    {
      t: "TRAMITACIÓN DE AVERÍAS",
      b: "El cliente debe comunicar cualquier avería a Garanticon en un plazo máximo de 3 días hábiles desde su aparición. Ninguna reparación realizada sin autorización previa generará obligación de pago.",
    },
    {
      t: "MANTENIMIENTO OBLIGATORIO",
      b: "El vehículo debe pasar revisiones cada 12 meses o 12.000 km (lo que antes ocurra), acreditadas con factura de taller. El incumplimiento implica la pérdida de la cobertura.",
    },
    { t: "ÁMBITO TERRITORIAL", b: "Territorio nacional español (Península e Islas)." },
    {
      t: "EXCLUSIONES",
      b: "Quedan excluidos: desgaste por uso, mantenimiento ordinario, daños por accidente, uso indebido del vehículo, modificaciones no homologadas, así como las piezas no contempladas expresamente en el listado de cobertura. Consulta el detalle completo en garanticon.es.",
    },
    {
      t: "VIGENCIA",
      b: `Esta póliza tiene vigencia desde ${fmtDate(data.fecha_inicio)} hasta ${fmtDate(data.fecha_fin)}.`,
    },
  ];

  let cy = 100;
  for (const c of conditions) {
    drawText(page2, c.t, margin, cy, { size: 10, bold: true, color: accent });
    cy += 16;
    // wrap básico
    const words = c.b.split(" ");
    const maxChars = 95;
    let line = "";
    for (const w of words) {
      if ((line + " " + w).trim().length > maxChars) {
        drawText(page2, line.trim(), margin, cy, { size: 9 });
        cy += 13;
        line = w;
      } else {
        line += " " + w;
      }
    }
    if (line.trim()) {
      drawText(page2, line.trim(), margin, cy, { size: 9 });
      cy += 13;
    }
    cy += 10;
  }

  // Firma
  cy = A4.h - 130;
  drawText(page2, "Firma del comprador", margin, cy, { size: 8, color: GREY, bold: true });
  page2.drawLine({
    start: { x: margin, y: A4.h - cy - 50 },
    end: { x: margin + 200, y: A4.h - cy - 50 },
    thickness: 0.5,
    color: rgb(...DARK),
  });
  drawText(page2, "Firma del vendedor", A4.w - margin - 200, cy, { size: 8, color: GREY, bold: true });
  page2.drawLine({
    start: { x: A4.w - margin - 200, y: A4.h - cy - 50 },
    end: { x: A4.w - margin, y: A4.h - cy - 50 },
    thickness: 0.5,
    color: rgb(...DARK),
  });

  drawText(
    page2,
    `Garanticon — Póliza ${data.numero_poliza} — ${fmtDate(data.fecha_venta)}`,
    margin,
    A4.h - 30,
    { size: 7.5, color: GREY },
  );

  const bytes = await doc.save();
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

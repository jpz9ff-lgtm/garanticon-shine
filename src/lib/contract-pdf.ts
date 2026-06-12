import { format } from "date-fns";

export type ContractData = {
  numero_poliza: string;
  modalidad: "ELITE" | "PLUS" | "ESENCIAL" | "BASIC";
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
  vendedor_direccion?: string | null;
  vendedor_telefono?: string | null;
  vendedor_email?: string | null;
  limite_averia?: number | null;
  aceptacion_fecha?: string | null; // ISO datetime de la firma
  defectos_preexistentes?: string | null;
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
const TIER_INFO: Record<string, { nombre: string; cobertura: number; color: [number, number, number] }> = {
  ELITE:    { nombre: "ÉLITE",    cobertura: 4500, color: [0.976, 0.451, 0.086] }, // #F97316
  PLUS:     { nombre: "PLUS",     cobertura: 3500, color: [0.486, 0.227, 0.929] }, // #7C3AED
  ESENCIAL: { nombre: "ESENCIAL", cobertura: 2500, color: [0.110, 0.110, 0.180] }, // #1C1C2E
  BASIC:    { nombre: "BASIC",    cobertura: 2500, color: [0.486, 0.227, 0.929] },
};

/**
 * Genera el contrato Garanticon programáticamente para cualquier modalidad
 * (ÉLITE / PLUS / ESENCIAL). Incluye datos del vehículo, comprador, vendedor,
 * condiciones específicas del tramo y texto de aceptación con fecha de firma.
 */
export async function generateContractPdf(data: ContractData): Promise<Blob> {
  const tier = TIER_INFO[data.modalidad] ?? TIER_INFO.ESENCIAL;
  const cobertura = data.limite_averia != null ? Number(data.limite_averia) : tier.cobertura;

  const out = await PDFDocument.create();
  const font = await out.embedFont(StandardFonts.Helvetica);
  const fontBold = await out.embedFont(StandardFonts.HelveticaBold);

  const page = out.addPage([595, 842]); // A4
  const { width: W, height: H } = page.getSize();

  const C_DARK: [number, number, number] = [0.12, 0.12, 0.16];
  const C_GREY: [number, number, number] = [0.45, 0.45, 0.5];
  const C_TIER = tier.color;

  let cursorY = H;

  const text = (
    str: string,
    x: number,
    yFromTop: number,
    opts: { size?: number; bold?: boolean; color?: [number, number, number] } = {},
  ) => {
    if (str === "" || str == null) return;
    const size = opts.size ?? 10;
    const f = opts.bold ? fontBold : font;
    const c = opts.color ?? C_DARK;
    page.drawText(String(str), { x, y: H - yFromTop, size, font: f, color: rgb(c[0], c[1], c[2]) });
  };

  // ===== CABECERA: banda con la modalidad =====
  page.drawRectangle({ x: 0, y: H - 90, width: W, height: 90, color: rgb(C_TIER[0], C_TIER[1], C_TIER[2]) });
  text("GARANTICON", 40, 38, { size: 18, bold: true, color: [1, 1, 1] });
  text("Contrato de garantía mecánica", 40, 60, { size: 10, color: [1, 1, 1] });
  text(tier.nombre, W - 40 - fontBold.widthOfTextAtSize(tier.nombre, 28), 50, {
    size: 28, bold: true, color: [1, 1, 1],
  });
  text(`Nº póliza ${data.numero_poliza}`, W - 200, 78, { size: 9, color: [1, 1, 1] });

  cursorY = 120;

  // ===== FECHAS =====
  const labelStyle = { size: 8, color: C_GREY };
  const valueStyle = { size: 10, bold: true };
  const col = (i: number) => 40 + i * 185;

  text("FECHA DE VENTA", col(0), cursorY, labelStyle);
  text(fmtDate(data.fecha_venta), col(0), cursorY + 14, valueStyle);
  text("INICIO COBERTURA", col(1), cursorY, labelStyle);
  text(fmtDate(data.fecha_inicio), col(1), cursorY + 14, valueStyle);
  text("FIN COBERTURA", col(2), cursorY, labelStyle);
  text(fmtDate(data.fecha_fin), col(2), cursorY + 14, valueStyle);

  cursorY += 40;

  // ===== COMPRADOR =====
  drawSection(page, font, fontBold, "DATOS DEL COMPRADOR", H - (H - cursorY), W, C_TIER);
  cursorY += 26;
  const row = (yOffset: number, items: Array<[string, string]>) => {
    items.forEach(([label, value], i) => {
      const x = 40 + (i % 2) * 270;
      const y = cursorY + Math.floor(i / 2) * 28 + yOffset;
      text(label, x, y, labelStyle);
      text(value || "—", x, y + 12, { size: 10 });
    });
    return Math.ceil(items.length / 2) * 28 + yOffset;
  };

  cursorY += row(0, [
    ["Nombre / Razón social", data.comprador_nombre],
    ["DNI / NIF", data.comprador_dni],
    ["Teléfono", data.comprador_telefono ?? ""],
    ["Email", data.comprador_email ?? ""],
    ["Dirección", data.comprador_direccion ?? ""],
    ["CP", data.comprador_cp ?? ""],
    ["Población", data.comprador_poblacion ?? ""],
    ["Provincia", data.comprador_provincia ?? ""],
  ]);

  cursorY += 10;

  // ===== VEHÍCULO =====
  drawSection(page, font, fontBold, "DATOS DEL VEHÍCULO", H - (H - cursorY), W, C_TIER);
  cursorY += 26;
  cursorY += row(0, [
    ["Marca y modelo", `${data.vehiculo_marca ?? ""} ${data.vehiculo_modelo ?? ""}`.trim()],
    ["Matrícula", data.matricula],
    ["Bastidor (VIN)", data.bastidor ?? ""],
    ["Fecha 1ª matriculación", fmtDate(data.fecha_matriculacion)],
    ["Kilómetros en venta", data.km_venta != null ? Number(data.km_venta).toLocaleString("es-ES") : ""],
    ["Precio de venta", data.precio_venta != null ? `${Number(data.precio_venta).toLocaleString("es-ES")} €` : ""],
    ["Combustible", data.combustible ?? ""],
    ["Cambio", `${data.tipo_cambio ?? ""}${data.traccion_4x4 ? " · 4x4" : ""}`],
  ]);

  cursorY += 10;

  // ===== VENDEDOR =====
  drawSection(page, font, fontBold, "DATOS DEL VENDEDOR", H - (H - cursorY), W, C_TIER);
  cursorY += 26;
  cursorY += row(0, [
    ["Empresa", data.vendedor_empresa ?? ""],
    ["CIF", data.vendedor_cif ?? ""],
  ]);

  cursorY += 10;

  // ===== CONDICIONES DEL TRAMO =====
  drawSection(page, font, fontBold, `CONDICIONES — GARANTÍA ${tier.nombre}`, H - (H - cursorY), W, C_TIER);
  cursorY += 26;

  const lines = [
    `• Cobertura máxima por avería: ${cobertura.toLocaleString("es-ES")} € IVA incluido.`,
    `• Límite total acumulado durante la vigencia: valor de tasación del vehículo (${
      data.precio_venta != null ? `${Number(data.precio_venta).toLocaleString("es-ES")} €` : "—"
    }).`,
    "• Averías sin relación técnica entre sí se consideran eventos independientes,",
    "  cada uno con su propio límite de cobertura.",
    "• Carencia: 15 días naturales y 1.000 km desde la fecha de venta.",
    "• Mantenimiento obligatorio cada 12 meses o 12.000 km (lo que antes ocurra).",
    "• Ámbito territorial: Península e Islas (España).",
  ];
  lines.forEach((l, i) => text(l, 40, cursorY + i * 14, { size: 9 }));
  cursorY += lines.length * 14 + 12;

  // ===== ACEPTACIÓN =====
  page.drawRectangle({
    x: 30, y: H - (cursorY + 110), width: W - 60, height: 105,
    color: rgb(0.94, 0.97, 1),
    borderColor: rgb(0.05, 0.2, 0.5),
    borderWidth: 0.5,
  });
  // Barra izquierda
  page.drawRectangle({
    x: 30, y: H - (cursorY + 110), width: 4, height: 105,
    color: rgb(0.05, 0.2, 0.5),
  });
  text("ACEPTACIÓN DE CONDICIONES Y LÍMITES", 44, cursorY + 12, { size: 9, bold: true, color: [0.05, 0.2, 0.5] });
  const aceptacionTexto = [
    `El comprador declara haber leído y comprender que la garantía GARANTICON ${tier.nombre}`,
    `cubre hasta ${cobertura.toLocaleString("es-ES")} € por avería. El total máximo abonado durante la`,
    `vigencia del contrato no superará el valor de tasación del vehículo (${
      data.precio_venta != null ? `${Number(data.precio_venta).toLocaleString("es-ES")} €` : "—"
    }).`,
    "Averías sin relación técnica entre sí se consideran eventos independientes, cada uno",
    "con su propio límite. Garanticon no está obligado a abonar cantidades superiores a los",
    "límites descritos aunque el coste real de reparación sea mayor.",
  ];
  aceptacionTexto.forEach((l, i) => text(l, 44, cursorY + 28 + i * 11, { size: 8, color: C_DARK }));
  const firmaFecha = data.aceptacion_fecha
    ? format(new Date(data.aceptacion_fecha), "dd/MM/yyyy HH:mm")
    : format(new Date(), "dd/MM/yyyy HH:mm");
  text(`Aceptado electrónicamente el ${firmaFecha}`, 44, cursorY + 98, { size: 8, bold: true, color: [0.05, 0.2, 0.5] });

  // Pie
  text("Garanticon · Documento generado automáticamente", 40, H - 30, { size: 7, color: C_GREY });

  const bytes = await out.save();
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  return new Blob([ab], { type: "application/pdf" });
}

function drawSection(
  page: any,
  _font: any,
  fontBold: any,
  title: string,
  _yAbs: number,
  W: number,
  color: [number, number, number],
) {
  // Dibuja una franja de título de sección
  const { height: H } = page.getSize();
  // _yAbs viene como H - yFromTop; lo convertimos de nuevo
  const yFromTop = H - _yAbs;
  page.drawRectangle({
    x: 30, y: H - yFromTop - 18, width: W - 60, height: 20,
    color: rgb(color[0], color[1], color[2]),
  });
  page.drawText(title, {
    x: 40, y: H - yFromTop - 4, size: 9, font: fontBold, color: rgb(1, 1, 1),
  });
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

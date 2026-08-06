import { format } from "date-fns";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type PDFImage, type RGB } from "pdf-lib";
import garanticonLogo from "@/assets/garanticon-logo.png.asset.json";

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
  aceptacion_fecha?: string | null;
  defectos_preexistentes?: string | null;
  es_electrico?: boolean | null;
};

const TIER: Record<string, { nombre: string; cobertura: number; accent: string; accentDark: string; accentLight: string }> = {
  ELITE:    { nombre: "ÉLITE",    cobertura: 4500, accent: "#F97316", accentDark: "#EA580C", accentLight: "#FFF7ED" },
  PLUS:     { nombre: "PLUS",     cobertura: 3500, accent: "#7C3AED", accentDark: "#5B21B6", accentLight: "#EDE9FE" },
  ESENCIAL: { nombre: "ESENCIAL", cobertura: 2500, accent: "#1C1C2E", accentDark: "#0F0F1A", accentLight: "#F3F4F6" },
  BASIC:    { nombre: "ESENCIAL", cobertura: 2500, accent: "#1C1C2E", accentDark: "#0F0F1A", accentLight: "#F3F4F6" },
};

const MM = 72 / 25.4;
const PAGE_WIDTH = 210 * MM;
const PAGE_HEIGHT = 297 * MM;
const PAGE_PADDING_X = 14 * MM;
const PAGE_PADDING_Y = 9 * MM;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_PADDING_X * 2;
const BLOCK_GAP = 8;
const COLUMN_GAP = 14;
const SECTION_PADDING_X = 12;
const SECTION_PADDING_Y = 10;

const COLORS = {
  orange: hex("#F97316"),
  orangeDark: hex("#EA580C"),
  purple: hex("#7C3AED"),
  dark: hex("#1C1C2E"),
  darkSoft: hex("#0F0F1A"),
  grey: hex("#6B7280"),
  greyLight: hex("#F3F4F6"),
  greyBorder: hex("#E5E7EB"),
  blue: hex("#1E40AF"),
  blueLight: hex("#EFF6FF"),
  green: hex("#00B894"),
  greenLight: hex("#ECFDF7"),
  white: rgb(1, 1, 1),
};

type Fonts = {
  regular: PDFFont;
  bold: PDFFont;
  black: PDFFont;
};

type Field = {
  label: string;
  value: string;
};

type ConditionItem = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  highlight?: boolean;
};

type PdfContext = {
  pdf: PDFDocument;
  page: PDFPage;
  fonts: Fonts;
  logo: PDFImage | null;
  y: number;
};

const fontCache = new Map<number, Promise<Uint8Array>>();
let logoCache: Promise<Uint8Array> | null = null;

const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  try { return format(new Date(d), "dd/MM/yyyy"); } catch { return "—"; }
};
const fmtEUR = (n?: number | null) =>
  n != null && !isNaN(Number(n)) ? `${Number(n).toLocaleString("es-ES")}€` : "—";
const v = (s?: string | null) => (s && String(s).trim() ? String(s) : "—");
function hex(value: string): RGB {
  const clean = value.replace("#", "");
  const full = clean.length === 3
    ? clean.split("").map((char) => char + char).join("")
    : clean;
  const int = Number.parseInt(full, 16);
  return rgb(
    ((int >> 16) & 255) / 255,
    ((int >> 8) & 255) / 255,
    (int & 255) / 255,
  );
}

function normalizeText(text?: string | null) {
  return String(text ?? "").replace(/\s+/g, " ").trim();
}

function topToPdfY(top: number, height: number) {
  return PAGE_HEIGHT - top - height;
}

function drawRect(page: PDFPage, x: number, top: number, width: number, height: number, options: {
  color?: RGB;
  borderColor?: RGB;
  borderWidth?: number;
  opacity?: number;
}) {
  page.drawRectangle({
    x,
    y: topToPdfY(top, height),
    width,
    height,
    color: options.color,
    borderColor: options.borderColor,
    borderWidth: options.borderWidth,
    opacity: options.opacity,
  });
}

function drawText(page: PDFPage, text: string, x: number, top: number, font: PDFFont, size: number, color: RGB) {
  page.drawText(text, {
    x,
    y: PAGE_HEIGHT - top - size,
    font,
    size,
    color,
  });
}

function splitLongWord(word: string, font: PDFFont, size: number, maxWidth: number) {
  const parts: string[] = [];
  let current = "";

  for (const char of word) {
    const candidate = `${current}${char}`;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !current) {
      current = candidate;
    } else {
      parts.push(current);
      current = char;
    }
  }

  if (current) parts.push(current);
  return parts;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const paragraphs = String(text ?? "")
    .split(/\n+/)
    .map((line) => normalizeText(line));

  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    if (!paragraph) {
      lines.push("");
      continue;
    }

    let current = "";
    const words = paragraph.split(" ");

    for (const rawWord of words) {
      const chunks = font.widthOfTextAtSize(rawWord, size) > maxWidth
        ? splitLongWord(rawWord, font, size, maxWidth)
        : [rawWord];

      for (const word of chunks) {
        const candidate = current ? `${current} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
          current = candidate;
        } else {
          if (current) lines.push(current);
          current = word;
        }
      }
    }

    if (current) lines.push(current);
  }

  return lines.length ? lines : [""];
}

function textBlockHeight(text: string, font: PDFFont, size: number, maxWidth: number, lineHeight: number) {
  return wrapText(text, font, size, maxWidth).length * lineHeight;
}

function drawTextBlock(page: PDFPage, text: string, x: number, top: number, width: number, font: PDFFont, size: number, color: RGB, lineHeight: number) {
  const lines = wrapText(text, font, size, width);
  lines.forEach((line, index) => drawText(page, line, x, top + index * lineHeight, font, size, color));
  return lines.length * lineHeight;
}

async function fetchBinary(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo cargar ${url}`);
  return new Uint8Array(await response.arrayBuffer());
}

async function loadFonts(pdf: PDFDocument): Promise<Fonts> {
  // Self-hosted approach: rely on standard PDF fonts (Helvetica) so the
  // contract PDF generator works under a strict CSP without any external
  // network requests (Google Fonts is blocked by font-src/connect-src 'self').
  pdf.registerFontkit(fontkit);
  return {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
    black: await pdf.embedFont(StandardFonts.HelveticaBold),
  };
}

async function loadLogo(pdf: PDFDocument) {
  try {
    logoCache ??= fetchBinary(new URL(garanticonLogo.url, window.location.origin).toString());
    const bytes = await logoCache;
    return await pdf.embedPng(bytes);
  } catch {
    return null;
  }
}

function addPage(ctx: PdfContext) {
  ctx.page = ctx.pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  ctx.y = PAGE_PADDING_Y;
}

function availableHeight(ctx: PdfContext) {
  return PAGE_HEIGHT - PAGE_PADDING_Y - ctx.y;
}

function ensureSpace(ctx: PdfContext, height: number) {
  const usable = PAGE_HEIGHT - PAGE_PADDING_Y * 2;
  if (height > usable) return;
  if (height > availableHeight(ctx)) addPage(ctx);
}

function drawSectionTitle(page: PDFPage, title: string, top: number, fonts: Fonts) {
  drawText(page, title.toUpperCase(), PAGE_PADDING_X + SECTION_PADDING_X, top, fonts.black, 11, COLORS.dark);
}

function measureFieldRows(fields: Field[], columns: number, fonts: Fonts, cellWidth: number) {
  const rows: number[] = [];
  for (let index = 0; index < fields.length; index += columns) {
    const row = fields.slice(index, index + columns);
    const rowHeight = Math.max(...row.map((field) => {
      const valueHeight = textBlockHeight(field.value, fonts.bold, 10, cellWidth, 12);
      return 9 + 4 + valueHeight;
    }));
    rows.push(rowHeight);
  }
  return rows;
}

function drawFieldSection(ctx: PdfContext, title: string, fields: Field[], columns: number) {
  const innerWidth = CONTENT_WIDTH - SECTION_PADDING_X * 2;
  const cellWidth = (innerWidth - (columns - 1) * 16) / columns;
  const rowHeights = measureFieldRows(fields, columns, ctx.fonts, cellWidth);
  const sectionHeight = SECTION_PADDING_Y + 14 + 8 + rowHeights.reduce((sum, value) => sum + value, 0) + (rowHeights.length - 1) * 8 + SECTION_PADDING_Y;

  ensureSpace(ctx, sectionHeight + BLOCK_GAP);

  drawRect(ctx.page, PAGE_PADDING_X, ctx.y, CONTENT_WIDTH, sectionHeight, { color: COLORS.greyLight });
  drawSectionTitle(ctx.page, title, ctx.y + SECTION_PADDING_Y, ctx.fonts);

  let cursorTop = ctx.y + SECTION_PADDING_Y + 22;

  fields.forEach((field, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    const rowTop = ctx.y + SECTION_PADDING_Y + 22 + rowHeights.slice(0, row).reduce((sum, value) => sum + value, 0) + row * 8;
    const fieldX = PAGE_PADDING_X + SECTION_PADDING_X + col * (cellWidth + 16);
    drawText(ctx.page, field.label.toUpperCase(), fieldX, rowTop, ctx.fonts.bold, 7.2, COLORS.grey);
    drawTextBlock(ctx.page, field.value, fieldX, rowTop + 12, cellWidth, ctx.fonts.bold, 10, COLORS.dark, 12);
    cursorTop = Math.max(cursorTop, rowTop + rowHeights[row]);
  });

  ctx.y += sectionHeight + BLOCK_GAP;
}

function drawDeclarationSection(ctx: PdfContext, defectos: string, evNote?: string) {
  const titleHeight = 14;
  const intro = "El comprador declara que el vehículo ha sido revisado y entregado sin averías conocidas en el momento de la firma, salvo las indicadas a continuación:";
  const introHeight = textBlockHeight(intro, ctx.fonts.regular, 9, CONTENT_WIDTH - SECTION_PADDING_X * 2, 11.5);
  const defectHeight = textBlockHeight(defectos, ctx.fonts.bold, 10, CONTENT_WIDTH - SECTION_PADDING_X * 2, 12);
  const evHeight = evNote
    ? textBlockHeight(evNote, ctx.fonts.regular, 8.5, CONTENT_WIDTH - SECTION_PADDING_X * 2, 10.7) + 8
    : 0;
  const sectionHeight = SECTION_PADDING_Y + titleHeight + 8 + introHeight + 8 + 9 + 4 + defectHeight + evHeight + SECTION_PADDING_Y;

  ensureSpace(ctx, sectionHeight + BLOCK_GAP);
  drawRect(ctx.page, PAGE_PADDING_X, ctx.y, CONTENT_WIDTH, sectionHeight, { color: COLORS.greyLight });
  drawSectionTitle(ctx.page, "Declaración del estado del vehículo a la entrega", ctx.y + SECTION_PADDING_Y, ctx.fonts);
  const start = ctx.y + SECTION_PADDING_Y + 20;
  const used = drawTextBlock(ctx.page, intro, PAGE_PADDING_X + SECTION_PADDING_X, start, CONTENT_WIDTH - SECTION_PADDING_X * 2, ctx.fonts.regular, 9, COLORS.dark, 11.5);
  drawText(ctx.page, "DEFECTOS PREEXISTENTES DECLARADOS", PAGE_PADDING_X + SECTION_PADDING_X, start + used + 8, ctx.fonts.bold, 7.2, COLORS.grey);
  const defectUsed = drawTextBlock(ctx.page, defectos, PAGE_PADDING_X + SECTION_PADDING_X, start + used + 20, CONTENT_WIDTH - SECTION_PADDING_X * 2, ctx.fonts.bold, 10, COLORS.dark, 12);
  if (evNote) {
    drawTextBlock(ctx.page, evNote, PAGE_PADDING_X + SECTION_PADDING_X, start + used + 20 + defectUsed + 8, CONTENT_WIDTH - SECTION_PADDING_X * 2, ctx.fonts.regular, 8.5, COLORS.dark, 10.7);
  }
  ctx.y += sectionHeight + BLOCK_GAP;
}

function drawCoverageSection(ctx: PdfContext, title: string, coverage: string, contractLimit: string, accent: { base: RGB; border: RGB; soft: RGB }) {
  const sectionHeight = 66;
  ensureSpace(ctx, sectionHeight + BLOCK_GAP);

  drawRect(ctx.page, PAGE_PADDING_X, ctx.y, CONTENT_WIDTH, sectionHeight, {
    color: accent.soft,
    borderColor: accent.base,
    borderWidth: 1,
  });

  const leftWidth = 150;
  const rightGap = 18;
  const rightWidth = CONTENT_WIDTH - 28 - leftWidth - rightGap;
  const cellWidth = (rightWidth - 10) / 2;
  const startX = PAGE_PADDING_X + 14;

  drawText(ctx.page, "MODALIDAD CONTRATADA", startX, ctx.y + 12, ctx.fonts.bold, 8, COLORS.grey);
  drawText(ctx.page, title, startX, ctx.y + 28, ctx.fonts.black, 17, accent.border);

  const rightX = startX + leftWidth + rightGap;
  [
    { value: coverage, label: "Máximo por avería" },
    { value: contractLimit, label: "Límite total del contrato" },
  ].forEach((cell, index) => {
    const x = rightX + index * (cellWidth + 10);
    const numberWidth = ctx.fonts.black.widthOfTextAtSize(cell.value, 16);
    drawText(ctx.page, cell.value, x + (cellWidth - numberWidth) / 2, ctx.y + 18, ctx.fonts.black, 16, accent.border);
    const labelWidth = ctx.fonts.regular.widthOfTextAtSize(cell.label, 8.5);
    drawText(ctx.page, cell.label, x + (cellWidth - labelWidth) / 2, ctx.y + 40, ctx.fonts.regular, 8.5, COLORS.grey);
  });

  ctx.y += sectionHeight + BLOCK_GAP;
}

function getConditions(coverage: string, contractLimit: string): ConditionItem[] {
  return [
    {
      title: "1. Definición de avería",
      paragraphs: [
        "Se entiende por avería la incapacidad repentina e inesperada de una pieza cubierta para funcionar conforme a especificación del fabricante, como resultado de un fallo mecánico, eléctrico o electrónico. La reducción gradual de rendimiento por antigüedad, desgaste o kilometraje no se considera avería.",
      ],
    },
    {
      title: "2. Elementos cubiertos",
      bullets: [
        "Motor: bloque motor, tapa de cilindros, bomba de aceite, bomba de agua.",
        "Caja de cambios: manual o automática, convertidor de par.",
        "Embrague: mecanismo (no el disco de desgaste).",
        "Sistema eléctrico: motor de arranque, alternador, módulos electrónicos.",
        "Dirección: caja/cremallera, bomba de dirección asistida.",
        "Frenos: servofreno, bomba de freno (no pastillas/discos).",
        "Alimentación: bomba de combustible, inyectores.",
        "Ejes y transmisión: palieres, diferencial.",
        "Refrigeración: radiador, termostato, bomba de agua.",
        "Aire acondicionado: compresor, condensador.",
      ],
      paragraphs: [
        "Cualquier componente, pieza o sistema no expresamente listado en este apartado queda excluido de la cobertura.",
      ],
    },
    {
      title: "3. Carencia",
      paragraphs: [
        "Esta garantía entra en vigor 15 días o 1.000 km después de la fecha de contratación, lo que ocurra primero. Las averías producidas durante este periodo no están cubiertas. A efectos de determinar si una avería está dentro del periodo de cobertura, se tomará como referencia la fecha en que se produce la avería, y no la de su comunicación, siempre que esta se realice dentro del plazo establecido en el punto 5.",
      ],
    },
    {
      title: "4. Mantenimiento obligatorio",
      paragraphs: [
        "El titular se compromete a realizar el mantenimiento del vehículo según las indicaciones del fabricante, con una periodicidad máxima de 12 meses o 12.000 km. El incumplimiento de esta obligación, debidamente acreditado, faculta a Garanticon para rechazar la cobertura de aquellas averías que guarden relación causal con dicho incumplimiento. Si el incumplimiento afecta de forma general al estado mecánico del vehículo, Garanticon podrá rechazar la cobertura de la garantía en su totalidad. El titular deberá conservar y, en caso de reclamación, presentar facturas o justificantes que acrediten el cumplimiento de este mantenimiento.",
      ],
    },
    {
      title: "5. Procedimiento ante una avería",
      paragraphs: [
        "El titular debe comunicar la avería a Garanticon en un plazo máximo de 3 días desde su detección, y obtener autorización previa antes de iniciar cualquier reparación. Las reparaciones realizadas sin autorización previa no serán objeto de cobertura. Si Garanticon no responde a la solicitud de autorización en un plazo de 48 horas laborables, el titular podrá proceder con la reparación aportando presupuesto previo, que será valorado conforme a las condiciones de esta garantía. En caso de avería que impida el uso seguro del vehículo fuera del horario de atención de Garanticon, el titular podrá proceder a la reparación urgente mínima necesaria, debiendo notificarlo a Garanticon en un plazo máximo de 24 horas junto con factura detallada para su valoración.",
      ],
    },
    {
      title: "6. Exclusiones",
      paragraphs: ["No están cubiertos:"],
      bullets: [
        "Daños derivados de negligencia grave acreditada del titular, accidente, uso indebido o manipulación del kilometraje.",
        "Piezas de desgaste normal: aceite, filtros, líquidos, pastillas y discos de freno, neumáticos, escobillas, bujías, correas (salvo correa de distribución por rotura mecánica).",
        "Daños consecuenciales: si una pieza no cubierta falla y daña por efecto una pieza cubierta, ese daño derivado no está incluido.",
        "Averías cubiertas por la garantía del fabricante o por otro seguro vigente.",
        "Gastos de diagnóstico cuando la avería resulte no estar cubierta.",
        "Reparaciones realizadas sin autorización previa de Garanticon.",
        "Daños a terceros, lesiones o responsabilidad civil derivada del uso del vehículo.",
      ],
    },
    {
      title: "7. Averías independientes",
      paragraphs: [
        "Se consideran averías independientes aquellas que, a juicio técnico, tienen causas distintas y sin relación directa entre sí. Cada avería independiente dispone de su propio límite de cobertura según el resumen de cobertura anterior.",
      ],
    },
    {
      title: "8. Ámbito territorial",
      paragraphs: [
        "La cobertura es válida en territorio español. Para asistencia fuera de España, el titular debe contactar previamente con Garanticon para confirmar la cobertura aplicable.",
      ],
    },
    {
      title: "9. Transmisión del vehículo",
      paragraphs: [
        "Esta garantía es personal e intransferible, salvo autorización expresa y por escrito de Garanticon en caso de venta del vehículo a un tercero durante la vigencia del contrato.",
      ],
    },
    {
      title: "10. Jurisdicción",
      paragraphs: [
        "Para cualquier controversia derivada de este contrato, las partes se someten a los Juzgados y Tribunales de San Sebastián de los Reyes (Madrid), sin perjuicio de los derechos que la normativa de consumo reconozca al consumidor.",
      ],
    },
    {
      title: "Conformidad con el alcance económico de tu garantía",
      paragraphs: [
        `El precio de esta garantía está calculado en base a los límites económicos descritos en este contrato: ${coverage} máximo por avería y ${contractLimit} máximo acumulado durante toda la vigencia.`,
        `Estos límites no son una restricción añadida después — son la base sobre la que se ha fijado el precio que has pagado. Por ejemplo: si una avería cubierta conforme a las secciones 1 a 8 de este contrato cuesta 6.000€ de reparación y tu garantía cubre hasta ${coverage}, Garanticon abona ${coverage} y la diferencia corre a tu cargo.`,
        "Una vez alcanzado el límite total acumulado, la garantía queda agotada, independientemente del número de averías o del tiempo restante de cobertura.",
        "Declaro que he sido informado de estos límites antes de firmar, que los he entendido, y que el precio pagado por esta garantía se corresponde con el alcance de cobertura aquí descrito, formando estos límites parte esencial del objeto del contrato.",
      ],
    },
  ];
}

const EV_CONDITIONS_BASE: ConditionItem[] = [
  {
    title: "1. Definiciones",
    paragraphs: [
      "Se entiende por avería la incapacidad repentina e inesperada de una pieza cubierta para funcionar conforme a especificación del fabricante, como resultado de un fallo mecánico, eléctrico o electrónico. La reducción gradual de rendimiento por antigüedad, desgaste o kilometraje no se considera avería.",
      "Degradación de la batería: disminución natural y progresiva de la capacidad de almacenamiento del pack de alta tensión. Se considera desgaste normal y queda excluida en todo caso, con independencia del porcentaje de pérdida. Estado de salud (SoH): porcentaje de capacidad útil de la batería respecto a su capacidad nominal de origen. No constituyen avería cubierta la degradación o pérdida gradual de capacidad de la batería ni la consiguiente reducción de autonomía.",
    ],
  },
  {
    title: "2. Tramitación y autorización",
    paragraphs: [
      "El titular debe comunicar la avería a Garanticon en un plazo máximo de 3 días desde su detección, y obtener autorización previa antes de iniciar cualquier reparación. Las reparaciones realizadas sin autorización previa no serán objeto de cobertura.",
      "Toda diagnosis o intervención sobre el sistema de alta tensión deberá realizarse en taller autorizado y con técnicos habilitados para trabajos en alta tensión conforme a la normativa vigente; la manipulación del sistema de alta tensión por personal no habilitado anula la cobertura. GARANTICON podrá requerir diagnosis oficial del estado de la batería y del sistema de alta tensión. Los gastos de diagnóstico, diagnosis del SoH y desmontaje correrán a cargo del propietario con independencia del resultado.",
    ],
  },
  {
    title: "3. Mantenimiento obligatorio",
    paragraphs: [
      "Condición esencial de vigencia: cumplimiento del plan de mantenimiento del fabricante para vehículo eléctrico, con la periodicidad que este establezca. Incluye, cuando el fabricante lo prevea: revisión y, en su caso, sustitución del líquido refrigerante de los circuitos de refrigeración de la batería y de la electrónica de potencia; revisión del sistema de alta tensión y de sus conexiones; diagnosis del estado de salud (SoH) de la batería; sustitución del filtro de habitáculo y del líquido de frenos; y comprobación del sistema de frenado regenerativo. Acreditación mediante factura original de taller. El incumplimiento o la imposibilidad de acreditar el mantenimiento —en particular el del circuito de refrigeración de la batería— supone la anulación total de la garantía y la pérdida del derecho a indemnización por siniestros posteriores a la revisión incumplida.",
    ],
  },
  {
    title: "4. Piezas cubiertas",
    paragraphs: ["Solo las piezas listadas. Todo lo no mencionado queda excluido."],
    bullets: [
      "Motor eléctrico de tracción: estator, rotor, rodamientos del motor.",
      "Electrónica de potencia: inversor/ondulador de tracción, convertidor DC-DC, variador de potencia.",
      "Cargador de a bordo (OBC) y su electrónica de control de carga interna.",
      "Transmisión/reductora de relación fija: engranajes, ejes, rodamientos y diferencial integrado.",
      "Sistema de gestión de la batería (BMS): unidad de control electrónica, ante fallo súbito de la unidad (no de las celdas ni de la capacidad).",
      "Sistema de refrigeración/climatización de la batería y de la electrónica de potencia: bomba de refrigerante, válvulas, sensores, resistencias/calentador e intercambiador. Excluida la recarga de gas y el rellenado de fluidos.",
      "Cableado de alta tensión y conectores de potencia: ante fallo súbito, no por daño externo.",
      "Dirección asistida eléctrica; compresor eléctrico de climatización; servofreno o bomba de vacío eléctrica.",
      "Puerto de carga (conjunto del conector): ante fallo eléctrico súbito, no por desgaste, golpe o mal uso.",
    ],
    closing: [
      "El pack de batería de alta tensión (celdas y módulos) se rige exclusivamente por la Cláusula Especial de Batería. Las piezas de reemplazo podrán ser nuevas, reconstruidas o recicladas, funcionalmente aptas, a criterio de GARANTICON.",
    ],
  },
  {
    title: "Cláusula especial — Batería de alta tensión",
    highlight: true,
    paragraphs: [
      "El pack de batería de alta tensión (celdas y módulos de tracción), su capacidad de almacenamiento y la autonomía del vehículo quedan EXPRESAMENTE EXCLUIDOS de la cobertura de esta garantía comercial. Esta garantía no cubre en ningún caso la degradación, la pérdida de capacidad, la reducción de autonomía ni el reemplazo del pack de batería. El COMPRADOR reconoce que el pack de batería puede estar amparado, en su caso, por la garantía del fabricante del vehículo, a la que deberá dirigirse directamente para cualquier incidencia relativa al mismo. GARANTICON cubre exclusivamente los componentes eléctricos, electrónicos y mecánicos listados en la cláusula 4, distintos del pack de batería.",
    ],
  },
  {
    title: "5. Exclusiones",
    paragraphs: [
      "Excluidos sin excepción: (a) la degradación o pérdida gradual de capacidad de la batería y la reducción de autonomía, cualquiera que sea su porcentaje; (b) el desgaste normal y los consumibles (batería auxiliar de 12V, neumáticos, pastillas y discos de freno, escobillas, filtros, fluidos, cable de carga y accesorios de recarga); (c) averías causadas por falta de mantenimiento acreditada o por circular con indicadores de avería activos; (d) daños al pack de batería o a cualquier componente por golpe, accidente, colisión, vandalismo, inmersión, incendio externo o fenómeno meteorológico; (e) averías preexistentes o en desarrollo en el momento de la venta; (f) daños en piezas cubiertas causados por fallo de piezas no cubiertas; (g) daños consecuenciales; (h) averías derivadas del uso de cargadores, wallbox, cables o equipos de recarga no homologados o no certificados por el fabricante; (i) daños atribuibles a carga rápida en corriente continua (DC) reiterada o fuera de las especificaciones del fabricante, o a mantener el vehículo inmovilizado con la batería a nivel de carga crítico durante periodos prolongados; (j) actualizaciones, reprogramaciones o manipulaciones de software no oficiales, incluida la alteración de parámetros del BMS o de la gestión de carga; (k) modificaciones no homologadas; (l) uso profesional, competición o no particular; (m) manipulación del cuentakilómetros; (n) reparaciones no autorizadas o realizadas por talleres no autorizados previamente; (o) averías comunicadas fuera de plazo; (p) averías cubiertas por la garantía del fabricante u otro seguro.",
      "El propietario que reclame cobertura deberá aportar la documentación que acredite que la avería es de carácter súbito y no incurre en ninguna de las exclusiones anteriores.",
    ],
  },
  {
    title: "6. Carencia",
    paragraphs: [
      "Esta garantía entra en vigor 15 días o 1.000 km después de la fecha de contratación, lo que ocurra primero. Las averías producidas durante este periodo no están cubiertas. A efectos de determinar si una avería está dentro del periodo de cobertura, se tomará como referencia la fecha en que se produce la avería, y no la de su comunicación, siempre que esta se realice dentro del plazo establecido.",
    ],
  },
  {
    title: "7. Averías independientes",
    paragraphs: [
      "Se consideran averías independientes aquellas que, a juicio técnico, tienen causas distintas y sin relación directa entre sí. Cada avería independiente dispone de su propio límite de cobertura según el resumen de cobertura anterior.",
    ],
  },
  {
    title: "8. Ámbito territorial y transmisión",
    paragraphs: [
      "La cobertura es válida en territorio español. Para asistencia fuera de España, el titular debe contactar previamente con Garanticon para confirmar la cobertura aplicable. Esta garantía es personal e intransferible, salvo autorización expresa y por escrito de Garanticon en caso de venta del vehículo a un tercero durante la vigencia del contrato.",
    ],
  },
  {
    title: "9. Obligaciones del propietario",
    paragraphs: [
      "(a) No circular con avería que pueda agravar el daño. (b) Conservar piezas sustituidas 30 días. (c) Facilitar acceso al vehículo para inspección y diagnosis. (d) Aportar la documentación de mantenimiento requerida. (e) No iniciar reparación sin autorización previa. (f) Utilizar exclusivamente equipos de recarga homologados y compatibles con el vehículo. (g) No manipular ni permitir la manipulación del software del vehículo, del BMS ni de la gestión de carga. (h) Respetar las recomendaciones de carga del fabricante y mantener un nivel de carga adecuado durante inmovilizaciones prolongadas. El incumplimiento de cualquiera de estas obligaciones faculta a GARANTICON para rechazar la cobertura del siniestro.",
    ],
  },
  {
    title: "10. Resolución",
    paragraphs: [
      "La garantía se resuelve por: pérdida total del vehículo; transmisión sin autorización (cláusula 8); manipulación del cuentakilómetros; manipulación del software del vehículo, del BMS o de la gestión de carga; uso de equipos de recarga no homologados; datos falsos en el certificado; uso no particular; o decisión de GARANTICON ante irregularidades en la tramitación de siniestros.",
    ],
  },
  {
    title: "11. Jurisdicción",
    paragraphs: [
      "Para cualquier controversia derivada de este contrato, las partes se someten a los Juzgados y Tribunales de San Sebastián de los Reyes (Madrid), sin perjuicio de los derechos que la normativa de consumo reconozca al consumidor.",
    ],
  },
];

export const EV_DECLARATION_NOTE =
  "El COMPRADOR reconoce expresamente que ha sido informado de que la degradación y la pérdida de capacidad de la batería de alta tensión NO están cubiertas por esta garantía, y de que el pack de batería se rige por la Cláusula Especial de Batería de las condiciones generales.";

function measureConditionItem(item: ConditionItem, fonts: Fonts, width: number) {
  let height = 8 + 12;

  for (const paragraph of item.paragraphs ?? []) {
    height += textBlockHeight(paragraph, fonts.regular, 8.5, width - 16, 10.7) + 4;
  }

  for (const bullet of item.bullets ?? []) {
    height += textBlockHeight(bullet, fonts.regular, 8.3, width - 28, 10.4) + 3;
  }

  return height + 8;
}

function drawConditionItem(page: PDFPage, item: ConditionItem, x: number, top: number, width: number, fonts: Fonts) {
  const height = measureConditionItem(item, fonts, width);
  drawRect(page, x, top, width, height, item.highlight
    ? { color: COLORS.greenLight, borderColor: COLORS.green, borderWidth: 1.2 }
    : { color: COLORS.greyLight });

  let cursor = top + 8;
  drawText(page, item.highlight ? item.title.toUpperCase() : item.title, x + 8, cursor, fonts.black, 9, item.highlight ? COLORS.green : COLORS.dark);
  cursor += 14;

  for (const paragraph of item.paragraphs ?? []) {
    cursor += drawTextBlock(page, paragraph, x + 8, cursor, width - 16, fonts.regular, 8.5, COLORS.dark, 10.7);
    cursor += 4;
  }

  for (const bullet of item.bullets ?? []) {
    drawText(page, "–", x + 8, cursor, fonts.bold, 8.5, COLORS.dark);
    cursor += drawTextBlock(page, bullet, x + 18, cursor, width - 28, fonts.regular, 8.3, COLORS.dark, 10.4);
    cursor += 3;
  }

  return height;
}

function drawConditionsHeading(ctx: PdfContext, continued = false, baseTitle = "Condiciones de la garantía") {
  const title = continued ? `${baseTitle} (continuación)` : baseTitle;
  const headingHeight = 22;
  ensureSpace(ctx, headingHeight + BLOCK_GAP);
  drawText(ctx.page, title.toUpperCase(), PAGE_PADDING_X, ctx.y, ctx.fonts.black, 11, COLORS.dark);
  drawRect(ctx.page, PAGE_PADDING_X, ctx.y + 16, CONTENT_WIDTH, 1, { color: COLORS.orange });
  ctx.y += headingHeight;
}

function drawConditionsSection(ctx: PdfContext, items: ConditionItem[], baseTitle?: string) {
  drawConditionsHeading(ctx, false, baseTitle);

  const columnTop = ctx.y;
  const columnWidth = (CONTENT_WIDTH - COLUMN_GAP) / 2;
  let column = 0;
  let leftY = columnTop;
  let rightY = columnTop;

  const resetColumns = () => {
    column = 0;
    leftY = ctx.y;
    rightY = ctx.y;
  };

  const newConditionsPage = () => {
    addPage(ctx);
    drawConditionsHeading(ctx, true, baseTitle);
    resetColumns();
  };

  resetColumns();

  for (const item of items) {
    const itemHeight = measureConditionItem(item, ctx.fonts, columnWidth);

    while (true) {
      const currentTop = column === 0 ? leftY : rightY;
      const spaceLeft = PAGE_HEIGHT - PAGE_PADDING_Y - currentTop;

      if (itemHeight <= spaceLeft) {
        const x = PAGE_PADDING_X + column * (columnWidth + COLUMN_GAP);
        drawConditionItem(ctx.page, item, x, currentTop, columnWidth, ctx.fonts);
        if (column === 0) {
          leftY += itemHeight + 6;
        } else {
          rightY += itemHeight + 6;
        }
        break;
      }

      if (column === 0) {
        column = 1;
      } else {
        newConditionsPage();
      }
    }
  }

  ctx.y = Math.max(leftY, rightY) + BLOCK_GAP;
}

function drawSignatures(ctx: PdfContext, data: ContractData, coverage: string, contractLimit: string) {
  const leftWidth = CONTENT_WIDTH * 0.58;
  const gap = 12;
  const rightWidth = CONTENT_WIDTH - leftWidth - gap;
  const textWidth = leftWidth - 24;
  const paragraphs = [
    `El precio de esta garantía está calculado en base a los límites económicos descritos en este contrato: ${coverage} máximo por avería y ${contractLimit} máximo acumulado durante toda la vigencia.`,
    `Estos límites no son una restricción añadida después — son la base sobre la que se ha fijado el precio que has pagado. Por ejemplo: si una avería cubierta conforme a las secciones 1 a 8 de este contrato cuesta 6.000€ de reparación y tu garantía cubre hasta ${coverage}, Garanticon abona ${coverage} y la diferencia corre a tu cargo.`,
    "Una vez alcanzado el límite total acumulado, la garantía queda agotada, independientemente del número de averías o del tiempo restante de cobertura.",
    "Declaro que he sido informado de estos límites antes de firmar, que los he entendido, y que el precio pagado por esta garantía se corresponde con el alcance de cobertura aquí descrito, formando estos límites parte esencial del objeto del contrato.",
  ];

  const leftHeight = 12 + 12 + paragraphs.reduce((sum, paragraph) => sum + textBlockHeight(paragraph, ctx.fonts.regular, 8.5, textWidth, 10.7) + 5, 0) + 18 + 24 + 28;
  const signatureBoxHeight = 84;
  const rightHeight = signatureBoxHeight * 2 + 8;
  const blockHeight = Math.max(leftHeight, rightHeight);

  ensureSpace(ctx, blockHeight + BLOCK_GAP + 28);

  drawRect(ctx.page, PAGE_PADDING_X, ctx.y, leftWidth, leftHeight, { color: COLORS.blueLight, borderColor: COLORS.blue, borderWidth: 1 });
  drawRect(ctx.page, PAGE_PADDING_X, ctx.y, 4, leftHeight, { color: COLORS.blue });
  let cursor = ctx.y + 10;
  drawText(ctx.page, "CONFORMIDAD CON EL ALCANCE ECONÓMICO DE TU GARANTÍA", PAGE_PADDING_X + 12, cursor, ctx.fonts.black, 9.5, COLORS.blue);
  cursor += 16;

  for (const paragraph of paragraphs) {
    cursor += drawTextBlock(ctx.page, paragraph, PAGE_PADDING_X + 12, cursor, textWidth, ctx.fonts.regular, 8.5, COLORS.dark, 10.7);
    cursor += 5;
  }

  drawRect(ctx.page, PAGE_PADDING_X + 12, cursor + 1, 10, 10, { borderColor: COLORS.blue, borderWidth: 1 });
  drawText(ctx.page, "He leído y entiendo el alcance económico de mi garantía", PAGE_PADDING_X + 28, cursor, ctx.fonts.bold, 8.5, COLORS.dark);
  cursor += 18;

  const rowWidth = textWidth;
  const cellGap = 8;
  const firmaWidth = rowWidth * 0.5;
  const otherWidth = (rowWidth - firmaWidth - cellGap * 2) / 2;
  [
    { x: PAGE_PADDING_X + 12, width: firmaWidth, label: "Firma" },
    { x: PAGE_PADDING_X + 12 + firmaWidth + cellGap, width: otherWidth, label: "Fecha" },
    { x: PAGE_PADDING_X + 12 + firmaWidth + cellGap + otherWidth + cellGap, width: otherWidth, label: "Hora" },
  ].forEach((cell) => {
    drawText(ctx.page, cell.label.toUpperCase(), cell.x, cursor, ctx.fonts.bold, 7.2, COLORS.grey);
    drawRect(ctx.page, cell.x, cursor + 14, cell.width, 0.8, { color: COLORS.dark });
  });

  const rightX = PAGE_PADDING_X + leftWidth + gap;
  [
    {
      title: "Firma del vendedor",
      who: v(data.vendedor_empresa),
      caption: "Nombre, cargo y firma",
      top: ctx.y,
    },
    {
      title: "Firma del comprador",
      who: `${v(data.comprador_nombre)} · DNI ${v(data.comprador_dni)}`,
      caption: "Firma del titular del contrato",
      top: ctx.y + signatureBoxHeight + 8,
    },
  ].forEach((box) => {
    drawRect(ctx.page, rightX, box.top, rightWidth, signatureBoxHeight, { color: COLORS.greyLight });
    drawText(ctx.page, box.title.toUpperCase(), rightX + 12, box.top + 10, ctx.fonts.black, 9, COLORS.dark);
    drawTextBlock(ctx.page, box.who, rightX + 12, box.top + 26, rightWidth - 24, ctx.fonts.bold, 10, COLORS.dark, 12);
    drawRect(ctx.page, rightX + 12, box.top + 58, rightWidth - 24, 0.8, { color: COLORS.dark });
    drawText(ctx.page, box.caption, rightX + 12, box.top + 64, ctx.fonts.regular, 8, COLORS.grey);
  });

  ctx.y += blockHeight + BLOCK_GAP;
}

function drawFooter(ctx: PdfContext) {
  const footerLines = [
    "GARANTICON es una marca comercial respaldada por Cabrick Automoción S.L. (CIF B01593748, Avda. Somosierra 12, 28703 San Sebastián de los Reyes, Madrid), entidad garante de las obligaciones derivadas de este contrato.",
    "Contacto: info@garanticon.es · Tel. +34 919 930 903 · www.garanticon.es",
    "Este documento constituye un contrato vinculante entre las partes indicadas. Conserve una copia para su consulta.",
  ];
  const footerHeight = footerLines.reduce((sum, line) => sum + textBlockHeight(line, ctx.fonts.regular, 7.4, CONTENT_WIDTH, 9), 0) + 10;

  ensureSpace(ctx, footerHeight);
  drawRect(ctx.page, PAGE_PADDING_X, ctx.y, CONTENT_WIDTH, 0.8, { color: COLORS.greyBorder });
  let cursor = ctx.y + 8;
  footerLines.forEach((line) => {
    const lines = wrapText(line, ctx.fonts.regular, 7.4, CONTENT_WIDTH);
    lines.forEach((wrapped, index) => {
      const lineWidth = ctx.fonts.regular.widthOfTextAtSize(wrapped, 7.4);
      drawText(ctx.page, wrapped, PAGE_PADDING_X + (CONTENT_WIDTH - lineWidth) / 2, cursor + index * 9, ctx.fonts.regular, 7.4, COLORS.grey);
    });
    cursor += lines.length * 9;
  });
}

function drawHeader(ctx: PdfContext, tierLabel: string, contractNumber: string, fechaContrato: string, accent: { base: RGB }, isEv = false) {
  const headerHeight = 72;
  drawRect(ctx.page, PAGE_PADDING_X, ctx.y, CONTENT_WIDTH, headerHeight, { color: COLORS.dark });

  const leftX = PAGE_PADDING_X + 16;
  const top = ctx.y + 14;

  if (ctx.logo) {
    const targetHeight = 26;
    const scale = targetHeight / ctx.logo.height;
    ctx.page.drawImage(ctx.logo, {
      x: leftX,
      y: topToPdfY(top, targetHeight),
      width: ctx.logo.width * scale,
      height: targetHeight,
    });
  } else {
    drawText(ctx.page, "garanti", leftX, top + 4, ctx.fonts.black, 18, COLORS.orange);
    const garantiWidth = ctx.fonts.black.widthOfTextAtSize("garanti", 18);
    drawText(ctx.page, "con", leftX + garantiWidth, top + 4, ctx.fonts.black, 18, COLORS.purple);
  }

  drawText(ctx.page, "Contrato de Garantía Mecánica", leftX, ctx.y + 46, ctx.fonts.regular, 9, rgb(0.8, 0.84, 0.88));

  const pillText = isEv ? `GARANTICON ${tierLabel} · ELÉCTRICO` : `GARANTICON ${tierLabel}`;
  const pillFontSize = 12.5;
  const pillPaddingX = 12;
  const pillWidth = ctx.fonts.black.widthOfTextAtSize(pillText, pillFontSize) + pillPaddingX * 2;
  const evBadgeText = "100% BEV";
  const evBadgeWidth = isEv ? ctx.fonts.black.widthOfTextAtSize(evBadgeText, 8) + 16 : 0;
  const pillX = PAGE_PADDING_X + CONTENT_WIDTH - pillWidth - 16;
  drawRect(ctx.page, pillX, ctx.y + 12, pillWidth, 24, { color: accent.base });
  drawText(ctx.page, pillText, pillX + pillPaddingX, ctx.y + 19, ctx.fonts.black, pillFontSize, COLORS.white);
  if (isEv) {
    const badgeX = pillX - evBadgeWidth - 8;
    drawRect(ctx.page, badgeX, ctx.y + 14, evBadgeWidth, 20, { color: COLORS.green });
    drawText(ctx.page, evBadgeText, badgeX + 8, ctx.y + 20, ctx.fonts.black, 8, COLORS.white);
  }

  const meta = `Contrato Nº ${contractNumber} · Fecha: ${fechaContrato}`;
  const metaWidth = ctx.fonts.regular.widthOfTextAtSize(meta, 8.5);
  drawText(ctx.page, meta, PAGE_PADDING_X + CONTENT_WIDTH - metaWidth - 16, ctx.y + 46, ctx.fonts.regular, 8.5, rgb(0.8, 0.84, 0.88));

  ctx.y += headerHeight + BLOCK_GAP;
}

export async function generateContractPdf(data: ContractData, filename?: string): Promise<Blob> {
  const pdf = await PDFDocument.create();
  const fonts = await loadFonts(pdf);
  const logo = await loadLogo(pdf);
  const ctx: PdfContext = {
    pdf,
    page: pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    fonts,
    logo,
    y: PAGE_PADDING_Y,
  };

  const tier = TIER[data.modalidad] ?? TIER.ESENCIAL;
  const isEv = Boolean(data.es_electrico);
  const coverage = fmtEUR(data.limite_averia != null ? Number(data.limite_averia) : tier.cobertura);
  const contractLimit = fmtEUR(data.precio_venta);
  const fechaContrato = data.aceptacion_fecha
    ? format(new Date(data.aceptacion_fecha), "dd/MM/yyyy HH:mm")
    : data.fecha_venta
      ? format(new Date(data.fecha_venta), "dd/MM/yyyy")
      : format(new Date(), "dd/MM/yyyy");
  const direccionComprador = [
    data.comprador_direccion,
    [data.comprador_cp, data.comprador_poblacion].filter(Boolean).join(" "),
    data.comprador_provincia,
  ].filter((part) => normalizeText(part)).join(", ") || "—";
  const contactoComprador = [data.comprador_telefono, data.comprador_email].filter(Boolean).join(" · ") || "—";
  const contactoVendedor = [data.vendedor_telefono, data.vendedor_email].filter(Boolean).join(" · ") || "—";

  drawHeader(ctx, tier.nombre, data.numero_poliza, fechaContrato, { base: hex(tier.accent) }, isEv);

  drawFieldSection(ctx, "Datos del vendedor", [
    { label: "Razón social", value: v(data.vendedor_empresa) },
    { label: "CIF", value: v(data.vendedor_cif) },
    { label: "Dirección", value: v(data.vendedor_direccion) },
    { label: "Contacto", value: contactoVendedor },
  ], 2);

  drawFieldSection(ctx, "Datos del comprador", [
    { label: "Nombre completo", value: v(data.comprador_nombre) },
    { label: "DNI / NIE", value: v(data.comprador_dni) },
    { label: "Dirección", value: direccionComprador },
    { label: "Contacto", value: contactoComprador },
  ], 2);

  drawFieldSection(ctx, "Datos del vehículo", [
    { label: "Marca y modelo", value: `${normalizeText(data.vehiculo_marca)} ${normalizeText(data.vehiculo_modelo)}`.trim() || "—" },
    { label: "Matrícula", value: v(data.matricula) },
    { label: "VIN / Nº bastidor", value: v(data.bastidor) },
    { label: "Fecha de matriculación", value: fmtDate(data.fecha_matriculacion) },
    { label: "Kilometraje", value: data.km_venta != null ? `${Number(data.km_venta).toLocaleString("es-ES")} km` : "—" },
    { label: "Valor de tasación", value: fmtEUR(data.precio_venta) },
  ], 3);

  drawFieldSection(ctx, "Vigencia del contrato", [
    { label: "Fecha de inicio", value: fmtDate(data.fecha_inicio) },
    { label: "Fecha de finalización", value: fmtDate(data.fecha_fin) },
  ], 2);

  drawDeclarationSection(
    ctx,
    v(data.defectos_preexistentes) === "—" ? "NINGUNO" : normalizeText(data.defectos_preexistentes),
    isEv ? EV_DECLARATION_NOTE : undefined,
  );
  drawCoverageSection(ctx, `GARANTICON ${tier.nombre}`, coverage, contractLimit, {
    base: hex(tier.accent),
    border: hex(tier.accentDark),
    soft: hex(tier.accentLight),
  });

  if (isEv) {
    drawConditionsSection(
      ctx,
      EV_CONDITIONS_BASE,
      `Condiciones generales — Modalidad ${tier.nombre} · Eléctrico · Nº ${data.numero_poliza}`,
    );
  } else {
    drawConditionsSection(ctx, getConditions(coverage, contractLimit).slice(0, 10));
  }
  drawSignatures(ctx, data, coverage, contractLimit);
  drawFooter(ctx);

  const bytes = await pdf.save();
  const arrayBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(arrayBuffer).set(bytes);
  const blob = new Blob([arrayBuffer], { type: "application/pdf" });
  if (filename) downloadBlob(blob, filename);
  return blob;
}

export function downloadBlob(blob: Blob, filename: string) {
  if (!blob || blob.size === 0) return;
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
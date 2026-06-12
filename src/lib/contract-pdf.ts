import { format } from "date-fns";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
};

const TIER: Record<string, { nombre: string; cobertura: number; accent: string; accentDark: string; accentLight: string }> = {
  ELITE:    { nombre: "ÉLITE",    cobertura: 4500, accent: "#F97316", accentDark: "#EA580C", accentLight: "#FFF7ED" },
  PLUS:     { nombre: "PLUS",     cobertura: 3500, accent: "#7C3AED", accentDark: "#5B21B6", accentLight: "#EDE9FE" },
  ESENCIAL: { nombre: "ESENCIAL", cobertura: 2500, accent: "#1C1C2E", accentDark: "#0F0F1A", accentLight: "#F3F4F6" },
  BASIC:    { nombre: "ESENCIAL", cobertura: 2500, accent: "#1C1C2E", accentDark: "#0F0F1A", accentLight: "#F3F4F6" },
};

const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  try { return format(new Date(d), "dd/MM/yyyy"); } catch { return "—"; }
};
const fmtEUR = (n?: number | null) =>
  n != null && !isNaN(Number(n)) ? `${Number(n).toLocaleString("es-ES")}€` : "—";
const v = (s?: string | null) => (s && String(s).trim() ? String(s) : "—");
const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

function buildContractHtml(data: ContractData): string {
  const t = TIER[data.modalidad] ?? TIER.ESENCIAL;
  const cobertura = data.limite_averia != null ? Number(data.limite_averia) : t.cobertura;
  const fechaContrato = data.aceptacion_fecha
    ? format(new Date(data.aceptacion_fecha), "dd/MM/yyyy HH:mm")
    : format(new Date(), "dd/MM/yyyy HH:mm");

  const direccionComprador = [
    data.comprador_direccion,
    [data.comprador_cp, data.comprador_poblacion].filter(Boolean).join(" "),
    data.comprador_provincia,
  ].filter((s) => s && String(s).trim()).join(", ") || "—";

  const contactoComprador = [data.comprador_telefono, data.comprador_email].filter(Boolean).join(" · ") || "—";
  const contactoVendedor = [data.vendedor_telefono, data.vendedor_email].filter(Boolean).join(" · ") || "—";

  return /* html */ `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8" />
<title>Garanticon ${esc(t.nombre)} — Contrato ${esc(data.numero_poliza)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
  :root{
    --accent:${t.accent}; --accent-dark:${t.accentDark}; --accent-light:${t.accentLight};
    --orange:#F97316; --purple:#7C3AED; --dark:#1C1C2E; --grey:#6B7280; --grey-light:#F3F4F6;
    --blue:#1E40AF; --blue-light:#EFF6FF;
  }
  @page { size: A4 portrait; margin: 10mm; }
  *,*::before,*::after{ box-sizing:border-box; }
  html,body{ margin:0; padding:0; background:#fff; color:var(--dark);
    font-family:'Nunito',system-ui,sans-serif; font-size:10px; line-height:1.45; }
  .doc{ width:190mm; margin:0 auto; }
  .block{ margin-bottom:8px; break-inside:avoid; page-break-inside:avoid; }
  .grid-2{ display:grid; grid-template-columns:1fr 1fr; gap:6px 16px; }
  .grid-3{ display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px 16px; }
  .field{ display:flex; flex-direction:column; }
  .field .lbl{ font-size:8px; font-weight:700; color:var(--grey); text-transform:uppercase; letter-spacing:.04em; }
  .field .val{ font-size:10px; font-weight:700; color:var(--dark); word-break:break-word; }
  .section{ background:var(--grey-light); border-radius:8px; padding:10px 12px; }
  .section h3{ margin:0 0 6px; font-size:11px; font-weight:800; color:var(--dark); text-transform:uppercase; letter-spacing:.05em; }

  /* Cabecera */
  .hdr{ display:flex; align-items:center; justify-content:space-between; gap:12px;
        background:var(--dark); color:#fff; border-radius:10px; padding:14px 16px; }
  .hdr .brand{ display:flex; align-items:center; gap:10px; }
  .hdr .shield{ width:32px; height:36px; border-radius:6px 6px 14px 14px; background:var(--purple);
                display:flex; align-items:center; justify-content:center; color:#fff; font-weight:900; font-size:16px; }
  .hdr .brand .name{ font-size:20px; font-weight:900; color:var(--orange); line-height:1; }
  .hdr .brand .sub{ font-size:9px; color:#cbd5e1; margin-top:2px; }
  .hdr .badge{ text-align:right; }
  .hdr .badge .pill{ display:inline-block; background:var(--accent); color:#fff; font-weight:900;
                     padding:6px 12px; border-radius:999px; font-size:13px; letter-spacing:.04em; }
  .hdr .badge .meta{ margin-top:6px; font-size:9px; color:#cbd5e1; }

  /* Cobertura */
  .cover{ display:flex; gap:16px; align-items:stretch;
          background:var(--accent-light); border:1px solid var(--accent); border-radius:10px; padding:12px 14px; }
  .cover .left{ flex:1; }
  .cover .left .lbl{ font-size:9px; color:var(--grey); text-transform:uppercase; font-weight:700; }
  .cover .left .mod{ font-size:18px; font-weight:900; color:var(--accent-dark); margin-top:2px; }
  .cover .right{ display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; flex:2; }
  .cover .right .cell{ text-align:center; }
  .cover .right .num{ font-size:16px; font-weight:900; color:var(--accent-dark); }
  .cover .right .cap{ font-size:8.5px; color:var(--grey); margin-top:2px; }

  /* Condiciones — 2 columnas */
  .cond{ font-size:8.5px; line-height:1.4; }
  .cond .cols{ column-count:2; column-gap:14px; }
  .cond .item{ break-inside:avoid; margin-bottom:6px; }
  .cond .item h4{ margin:0 0 2px; font-size:9px; font-weight:800; color:var(--dark); }
  .cond ul{ margin:2px 0 0 14px; padding:0; }
  .cond ul li{ margin-bottom:1px; }

  /* Firmas */
  .firmas{ display:grid; grid-template-columns:1.3fr 1fr; gap:10px; }
  .conformidad{ background:var(--blue-light); border-left:4px solid var(--blue); border-radius:6px; padding:10px 12px; font-size:8.5px; line-height:1.4; }
  .conformidad h3{ margin:0 0 4px; font-size:10px; font-weight:800; color:var(--blue); }
  .conformidad p{ margin:0 0 4px; }
  .conformidad .firma-row{ display:grid; grid-template-columns:2fr 1fr 1fr; gap:8px; margin-top:8px; padding-top:6px; border-top:1px solid #cbd5e1; }
  .conformidad .firma-row .lbl{ font-size:8px; color:var(--grey); }
  .conformidad .firma-row .line{ border-bottom:1px solid var(--dark); height:18px; }
  .check{ display:flex; align-items:center; gap:6px; margin-top:6px; font-weight:700; font-size:8.5px; }
  .check .box{ width:10px; height:10px; border:1px solid var(--blue); border-radius:2px; display:inline-block; }
  .firmas .stack{ display:flex; flex-direction:column; gap:8px; }
  .firma-box{ background:var(--grey-light); border-radius:8px; padding:10px 12px; }
  .firma-box .ttl{ font-size:9px; font-weight:800; color:var(--dark); text-transform:uppercase; }
  .firma-box .who{ font-size:10px; font-weight:700; margin-top:2px; }
  .firma-box .line{ border-bottom:1px solid var(--dark); height:24px; margin-top:10px; }
  .firma-box .cap{ font-size:8px; color:var(--grey); margin-top:2px; }

  /* Pie */
  .foot{ margin-top:10px; padding-top:6px; border-top:1px solid #e5e7eb; text-align:center; color:var(--grey); font-size:7.5px; line-height:1.5; }
</style>
</head><body>
<div class="doc">

  <div class="block hdr">
    <div class="brand">
      <div class="shield">G</div>
      <div>
        <div class="name">garanticon</div>
        <div class="sub">Contrato de Garantía Mecánica</div>
      </div>
    </div>
    <div class="badge">
      <div class="pill">GARANTICON ${esc(t.nombre)}</div>
      <div class="meta">Contrato Nº ${esc(data.numero_poliza)} · Fecha: ${esc(fechaContrato)}</div>
    </div>
  </div>

  <div class="block section">
    <h3>Datos del vendedor</h3>
    <div class="grid-2">
      <div class="field"><span class="lbl">Razón social</span><span class="val">${esc(v(data.vendedor_empresa))}</span></div>
      <div class="field"><span class="lbl">CIF</span><span class="val">${esc(v(data.vendedor_cif))}</span></div>
      <div class="field"><span class="lbl">Dirección</span><span class="val">${esc(v(data.vendedor_direccion))}</span></div>
      <div class="field"><span class="lbl">Contacto</span><span class="val">${esc(contactoVendedor)}</span></div>
    </div>
  </div>

  <div class="block section">
    <h3>Datos del comprador</h3>
    <div class="grid-2">
      <div class="field"><span class="lbl">Nombre completo</span><span class="val">${esc(v(data.comprador_nombre))}</span></div>
      <div class="field"><span class="lbl">DNI / NIE</span><span class="val">${esc(v(data.comprador_dni))}</span></div>
      <div class="field"><span class="lbl">Dirección</span><span class="val">${esc(direccionComprador)}</span></div>
      <div class="field"><span class="lbl">Contacto</span><span class="val">${esc(contactoComprador)}</span></div>
    </div>
  </div>

  <div class="block section">
    <h3>Datos del vehículo</h3>
    <div class="grid-3">
      <div class="field"><span class="lbl">Marca y modelo</span><span class="val">${esc(`${data.vehiculo_marca ?? ""} ${data.vehiculo_modelo ?? ""}`.trim() || "—")}</span></div>
      <div class="field"><span class="lbl">Matrícula</span><span class="val">${esc(v(data.matricula))}</span></div>
      <div class="field"><span class="lbl">VIN / Nº bastidor</span><span class="val">${esc(v(data.bastidor))}</span></div>
      <div class="field"><span class="lbl">Año de matriculación</span><span class="val">${esc(fmtDate(data.fecha_matriculacion))}</span></div>
      <div class="field"><span class="lbl">Kilometraje</span><span class="val">${data.km_venta != null ? esc(Number(data.km_venta).toLocaleString("es-ES") + " km") : "—"}</span></div>
      <div class="field"><span class="lbl">Valor de tasación</span><span class="val">${esc(fmtEUR(data.precio_venta))}</span></div>
    </div>
  </div>

  <div class="block section">
    <h3>Vigencia del contrato</h3>
    <div class="grid-2">
      <div class="field"><span class="lbl">Fecha de inicio</span><span class="val">${esc(fmtDate(data.fecha_inicio))}</span></div>
      <div class="field"><span class="lbl">Fecha de finalización</span><span class="val">${esc(fmtDate(data.fecha_fin))}</span></div>
    </div>
  </div>

  <div class="block section">
    <h3>Declaración del estado del vehículo a la entrega</h3>
    <p style="margin:0 0 6px;">El comprador declara que el vehículo ha sido revisado y entregado sin averías conocidas en el momento de la firma, salvo las indicadas a continuación:</p>
    <div class="field"><span class="lbl">Defectos preexistentes declarados</span><span class="val">${esc(v(data.defectos_preexistentes) === "—" ? "NINGUNO" : data.defectos_preexistentes!)}</span></div>
  </div>

  <div class="block cover">
    <div class="left">
      <div class="lbl">Modalidad contratada</div>
      <div class="mod">GARANTICON ${esc(t.nombre)}</div>
    </div>
    <div class="right">
      <div class="cell"><div class="num">${esc(fmtEUR(cobertura))}</div><div class="cap">Máximo por avería</div></div>
      <div class="cell"><div class="num">${esc(fmtEUR(data.precio_venta))}</div><div class="cap">Límite total del contrato</div></div>
      <div class="cell"><div class="num">${esc(fmtEUR(data.precio_venta))}</div><div class="cap">Precio de esta garantía</div></div>
    </div>
  </div>

  <div class="block section cond">
    <h3>Condiciones de la garantía</h3>
    <div class="cols">
      <div class="item"><h4>1. Definición de avería</h4>
        <p>Se entiende por avería la incapacidad repentina e inesperada de una pieza cubierta para funcionar conforme a especificación del fabricante, como resultado de un fallo mecánico, eléctrico o electrónico. La reducción gradual de rendimiento por antigüedad, desgaste o kilometraje no se considera avería.</p>
      </div>
      <div class="item"><h4>2. Elementos cubiertos</h4>
        <ul>
          <li><b>Motor:</b> bloque motor, tapa de cilindros, bomba de aceite, bomba de agua.</li>
          <li><b>Caja de cambios:</b> manual o automática, convertidor de par.</li>
          <li><b>Embrague:</b> mecanismo (no el disco de desgaste).</li>
          <li><b>Sistema eléctrico:</b> motor de arranque, alternador, módulos electrónicos.</li>
          <li><b>Dirección:</b> caja/cremallera, bomba de dirección asistida.</li>
          <li><b>Frenos:</b> servofreno, bomba de freno (no pastillas/discos).</li>
          <li><b>Alimentación:</b> bomba de combustible, inyectores.</li>
          <li><b>Ejes y transmisión:</b> palieres, diferencial.</li>
          <li><b>Refrigeración:</b> radiador, termostato, bomba de agua.</li>
          <li><b>Aire acondicionado:</b> compresor, condensador.</li>
        </ul>
        <p style="margin-top:3px;">Cualquier componente, pieza o sistema no expresamente listado en este apartado queda excluido de la cobertura.</p>
      </div>
      <div class="item"><h4>3. Carencia</h4>
        <p>Esta garantía entra en vigor 15 días o 1.000 km después de la fecha de contratación, lo que ocurra primero. Las averías producidas durante este periodo no están cubiertas.</p>
      </div>
      <div class="item"><h4>4. Mantenimiento obligatorio</h4>
        <p>El titular se compromete a realizar el mantenimiento del vehículo según las indicaciones del fabricante, con una periodicidad máxima de 12 meses o 12.000 km. El incumplimiento de esta obligación, debidamente acreditado, anula la cobertura de esta garantía en su totalidad. El titular deberá conservar y, en caso de reclamación, presentar facturas o justificantes que acrediten el cumplimiento de este mantenimiento.</p>
      </div>
      <div class="item"><h4>5. Procedimiento ante una avería</h4>
        <p>El titular debe comunicar la avería a Garanticon en un plazo máximo de 3 días desde su detección, y obtener autorización previa antes de iniciar cualquier reparación. Las reparaciones realizadas sin autorización previa no serán objeto de cobertura. En caso de avería que impida el uso seguro del vehículo fuera del horario de atención de Garanticon, el titular podrá proceder a la reparación urgente mínima necesaria, debiendo notificarlo a Garanticon en un plazo máximo de 24 horas junto con factura detallada para su valoración.</p>
      </div>
      <div class="item"><h4>6. Exclusiones</h4>
        <p>No están cubiertos:</p>
        <ul>
          <li>Piezas de desgaste normal: aceite, filtros, líquidos, pastillas y discos de freno, neumáticos, escobillas, bujías, correas (salvo correa de distribución por rotura mecánica).</li>
          <li>Daños derivados de negligencia, accidente, uso indebido o manipulación del kilometraje.</li>
          <li>Daños consecuenciales: si una pieza no cubierta falla y daña por efecto una pieza cubierta, ese daño derivado no está incluido.</li>
          <li>Averías cubiertas por la garantía del fabricante o por otro seguro vigente.</li>
          <li>Gastos de diagnóstico cuando la avería resulte no estar cubierta.</li>
          <li>Reparaciones realizadas sin autorización previa de Garanticon.</li>
          <li>Daños a terceros, lesiones o responsabilidad civil derivada del uso del vehículo.</li>
        </ul>
      </div>
      <div class="item"><h4>7. Averías independientes</h4>
        <p>Se consideran averías independientes aquellas que, a juicio técnico, tienen causas distintas y sin relación directa entre sí. Cada avería independiente dispone de su propio límite de cobertura según el resumen de cobertura anterior.</p>
      </div>
      <div class="item"><h4>8. Ámbito territorial</h4>
        <p>La cobertura es válida en territorio español. Para asistencia fuera de España, el titular debe contactar previamente con Garanticon para confirmar la cobertura aplicable.</p>
      </div>
      <div class="item"><h4>9. Transmisión del vehículo</h4>
        <p>Esta garantía es personal e intransferible, salvo autorización expresa y por escrito de Garanticon en caso de venta del vehículo a un tercero durante la vigencia del contrato.</p>
      </div>
      <div class="item"><h4>10. Jurisdicción</h4>
        <p>Para cualquier controversia derivada de este contrato, las partes se someten a los Juzgados y Tribunales de San Sebastián de los Reyes (Madrid), sin perjuicio de los derechos que la normativa de consumo reconozca al consumidor.</p>
      </div>
    </div>
  </div>

  <div class="block firmas">
    <div class="conformidad">
      <h3>Conformidad con el alcance económico de tu garantía</h3>
      <p>El precio de esta garantía está calculado en base a los límites económicos descritos en este contrato: <b>${esc(fmtEUR(cobertura))}</b> máximo por avería y <b>${esc(fmtEUR(data.precio_venta))}</b> máximo acumulado durante toda la vigencia.</p>
      <p>Estos límites no son una restricción añadida después — son la base sobre la que se ha fijado el precio que has pagado. Por ejemplo: si una avería cubierta conforme a las secciones 1 a 8 de este contrato cuesta 6.000€ de reparación y tu garantía cubre hasta ${esc(fmtEUR(cobertura))}, Garanticon abona ${esc(fmtEUR(cobertura))} y la diferencia corre a tu cargo.</p>
      <p>Una vez alcanzado el límite total acumulado, la garantía queda agotada, independientemente del número de averías o del tiempo restante de cobertura.</p>
      <p>Declaro que he sido informado de estos límites antes de firmar, que los he entendido, que el precio pagado se corresponde con ellos, y que no presentaré reclamaciones por cantidades que los superen.</p>
      <div class="check"><span class="box"></span> He leído y entiendo el alcance económico de mi garantía</div>
      <div class="firma-row">
        <div><div class="lbl">Firma</div><div class="line"></div></div>
        <div><div class="lbl">Fecha</div><div class="line"></div></div>
        <div><div class="lbl">Hora</div><div class="line"></div></div>
      </div>
    </div>
    <div class="stack">
      <div class="firma-box">
        <div class="ttl">Firma del vendedor</div>
        <div class="who">${esc(v(data.vendedor_empresa))}</div>
        <div class="line"></div>
        <div class="cap">Nombre, cargo y firma</div>
      </div>
      <div class="firma-box">
        <div class="ttl">Firma del comprador</div>
        <div class="who">${esc(v(data.comprador_nombre))} · DNI ${esc(v(data.comprador_dni))}</div>
        <div class="line"></div>
        <div class="cap">Firma del titular del contrato</div>
      </div>
    </div>
  </div>

  <div class="foot">
    GARANTICON es una marca comercial respaldada por Cabrick Automoción S.L. (CIF B01593748, Avda. Somosierra 12, 28703 San Sebastián de los Reyes, Madrid), entidad garante de las obligaciones derivadas de este contrato.<br/>
    Este documento constituye un contrato vinculante entre las partes indicadas. Conserve una copia para su consulta.
  </div>
</div>
</body></html>`;
}

/**
 * Genera el contrato como PDF real (descargable) renderizando el HTML
 * en un iframe oculto, capturándolo con html2canvas y exportando con jsPDF.
 */
export async function generateContractPdf(data: ContractData): Promise<Blob> {
  const html = buildContractHtml(data);

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-10000px";
  iframe.style.top = "0";
  iframe.style.width = "210mm";
  iframe.style.height = "297mm";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  try {
    const idoc = iframe.contentDocument!;
    idoc.open();
    idoc.write(html);
    idoc.close();

    // Esperar a que carguen fuentes/imágenes
    await new Promise<void>((resolve) => {
      const done = () => resolve();
      if (idoc.readyState === "complete") {
        // pequeño delay para fuentes Google
        setTimeout(done, 600);
      } else {
        iframe.addEventListener("load", () => setTimeout(done, 600), { once: true });
      }
    });
    try {
      // @ts-ignore
      await (idoc as any).fonts?.ready;
    } catch {}

    const target = idoc.querySelector(".doc") as HTMLElement;
    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: target.scrollWidth,
      windowHeight: target.scrollHeight,
    });

    const pdf = new jsPDF("p", "mm", "a4");
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;
    const imgData = canvas.toDataURL("image/jpeg", 0.92);

    let heightLeft = imgH;
    let position = 0;
    pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH);
    heightLeft -= pageH;
    while (heightLeft > 0) {
      position = heightLeft - imgH;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH);
      heightLeft -= pageH;
    }

    return pdf.output("blob");
  } finally {
    document.body.removeChild(iframe);
  }
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
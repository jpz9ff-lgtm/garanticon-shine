import { z } from "npm:zod@3.23.8";
import {
  adminClient,
  clientIp,
  corsHeaders,
  isRateLimited,
  json,
} from "../_shared/rate-limit.ts";

const BodySchema = z.object({
  nombre: z.string().trim().min(2).max(200),
  telefono: z.string().trim().min(6).max(25),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  matricula: z.string().trim().max(20).optional().or(z.literal("")),
  numero_poliza: z.string().trim().max(50).optional().or(z.literal("")),
  tipo: z.string().trim().min(1).max(50),
  descripcion: z.string().trim().min(10).max(2000),
  website: z.string().max(0).optional(), // honeypot: debe llegar vacío
  submissionId: z.string().uuid().optional(),
});

const escapeText = (v: string) => v.replace(/[<>]/g, "");

/** Única vía de entrada del formulario de asistencia: validación y límites en servidor. */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const admin = adminClient();
  const ip = clientIp(req);

  // Tope de coste y antiautomatización por origen
  if (await isRateLimited(admin, "submit-assistance-ip", ip, 3, 600)) {
    return json({ error: "Has enviado demasiadas solicitudes. Inténtalo más tarde." }, 429);
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ error: "Solicitud no válida" }, 400);
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return json({ error: "Revisa los datos del formulario" }, 400);
  }
  const d = parsed.data;

  const submissionId = d.submissionId ?? crypto.randomUUID();

  // Idempotencia: si ya existe esa solicitud, no se duplica ni se reenvía el aviso
  const { data: existing } = await admin
    .from("contacts")
    .select("id")
    .eq("id", submissionId)
    .maybeSingle();
  if (existing) return json({ ok: true, duplicated: true });

  const mensaje =
    `[${escapeText(d.tipo).toUpperCase()}] ${escapeText(d.descripcion)}\n\n— ` +
    `${escapeText(d.nombre)} · Tel: ${escapeText(d.telefono)}`;

  const { error } = await admin.from("contacts").insert({
    id: submissionId,
    nombre: escapeText(d.nombre),
    email: d.email ? d.email.toLowerCase() : null,
    matricula: d.matricula ? d.matricula.toUpperCase() : null,
    numero_poliza: d.numero_poliza ? d.numero_poliza.toUpperCase() : null,
    mensaje,
  });

  if (error) {
    console.error("submit-assistance insert failed", error.message);
    return json({ error: "No se pudo registrar tu solicitud" }, 500);
  }

  // Aviso interno; el destinatario está fijado en la plantilla del servidor
  try {
    await admin.functions.invoke("send-transactional-email", {
      body: {
        templateName: "assistance-notification",
        idempotencyKey: `assistance-${submissionId}`,
        templateData: {
          nombre: escapeText(d.nombre),
          telefono: escapeText(d.telefono),
          email: d.email ?? "",
          matricula: d.matricula ?? "",
          numero_poliza: d.numero_poliza ?? "",
          tipo: escapeText(d.tipo),
          descripcion: escapeText(d.descripcion),
        },
      },
    });
  } catch (e) {
    console.error("submit-assistance notification failed", String(e));
  }

  return json({ ok: true, submissionId });
});

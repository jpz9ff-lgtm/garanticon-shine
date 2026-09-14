import {
  adminClient,
  clientIp,
  corsHeaders,
  isRateLimited,
  json,
  normalizePlate,
  normalizePolicy,
  sha256,
} from "../_shared/rate-limit.ts";

const CODE_TTL_MINUTES = 10;

/** Envía un código de un uso al contacto ya registrado en la póliza. Respuesta genérica. */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = adminClient();
  const ip = clientIp(req);
  const generic = { ok: true, message: "Si los datos son correctos, hemos enviado un código al contacto registrado en la póliza." };

  if (await isRateLimited(admin, "request-policy-access-ip", ip, 5, 600)) {
    return json({ error: "Demasiadas solicitudes. Inténtalo más tarde." }, 429);
  }

  try {
    const body = await req.json();
    const matricula = normalizePlate(body?.matricula);
    const numero_poliza = normalizePolicy(body?.numero_poliza);
    if (!matricula || !numero_poliza) return json(generic);

    const { data: w } = await admin
      .from("warranties")
      .select("id,numero_poliza,comprador_email")
      .eq("matricula", matricula)
      .eq("numero_poliza", numero_poliza)
      .maybeSingle();

    if (!w?.comprador_email) return json(generic);

    if (await isRateLimited(admin, "request-policy-access-warranty", w.id, 3, 900)) {
      return json(generic);
    }

    const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
    const code_hash = await sha256(`${w.id}:${code}`);

    // Invalida códigos anteriores no usados
    await admin
      .from("policy_access_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("warranty_id", w.id)
      .is("used_at", null);

    await admin.from("policy_access_codes").insert({
      warranty_id: w.id,
      code_hash,
      expires_at: new Date(Date.now() + CODE_TTL_MINUTES * 60_000).toISOString(),
    });

    await admin.functions.invoke("send-transactional-email", {
      body: {
        templateName: "policy-access-code",
        recipientEmail: w.comprador_email,
        idempotencyKey: `policy-access-${w.id}-${code_hash.slice(0, 12)}`,
        templateData: {
          codigo: code,
          numero_poliza: w.numero_poliza,
          minutos: CODE_TTL_MINUTES,
        },
      },
    });

    return json(generic);
  } catch {
    return json(generic);
  }
});

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

const MAX_ATTEMPTS = 5;

/** Verifica el código de un uso y devuelve los datos completos para el contrato. */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = adminClient();
  const ip = clientIp(req);
  const invalid = { error: "Código no válido o caducado." };

  if (await isRateLimited(admin, "verify-policy-access-ip", ip, 10, 600)) {
    return json({ error: "Demasiados intentos. Inténtalo más tarde." }, 429);
  }

  try {
    const body = await req.json();
    const matricula = normalizePlate(body?.matricula);
    const numero_poliza = normalizePolicy(body?.numero_poliza);
    const code = String(body?.codigo ?? "").replace(/\D/g, "");
    if (!matricula || !numero_poliza || code.length !== 6) return json(invalid, 400);

    const { data: w } = await admin
      .from("warranties")
      .select("*")
      .eq("matricula", matricula)
      .eq("numero_poliza", numero_poliza)
      .maybeSingle();

    if (!w) return json(invalid, 400);

    const { data: rec } = await admin
      .from("policy_access_codes")
      .select("id,code_hash,attempts,expires_at,used_at")
      .eq("warranty_id", w.id)
      .is("used_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!rec) return json(invalid, 400);
    if (new Date(rec.expires_at).getTime() < Date.now()) return json(invalid, 400);
    if (rec.attempts >= MAX_ATTEMPTS) return json(invalid, 400);

    const hash = await sha256(`${w.id}:${code}`);
    if (hash !== rec.code_hash) {
      await admin
        .from("policy_access_codes")
        .update({ attempts: rec.attempts + 1 })
        .eq("id", rec.id);
      return json(invalid, 400);
    }

    // Uso único
    await admin
      .from("policy_access_codes")
      .update({ used_at: new Date().toISOString(), attempts: rec.attempts + 1 })
      .eq("id", rec.id);

    const { data: dealer } = await admin
      .from("dealers")
      .select("nombre_empresa,cif")
      .eq("id", w.dealer_id)
      .maybeSingle();

    const { dealer_id: _d, ...warranty } = w as Record<string, unknown>;
    return json({ warranty, dealer: dealer ?? null });
  } catch {
    return json({ error: "Error inesperado" }, 500);
  }
});

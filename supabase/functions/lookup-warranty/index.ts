import {
  adminClient,
  clientIp,
  corsHeaders,
  isRateLimited,
  json,
  normalizePlate,
  normalizePolicy,
} from "../_shared/rate-limit.ts";

/**
 * Consulta pública mínima: matrícula + número de póliza devuelven solo el estado de
 * cobertura. Los datos personales y el contrato requieren verificación del titular
 * (request-policy-access / verify-policy-access).
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = adminClient();
  const ip = clientIp(req);

  if (await isRateLimited(admin, "lookup-warranty", ip, 10, 60)) {
    return json({ error: "Demasiadas consultas. Espera un minuto e inténtalo de nuevo." }, 429);
  }

  try {
    const body = await req.json();
    const matricula = normalizePlate(body?.matricula);
    const numero_poliza = normalizePolicy(body?.numero_poliza);

    if (!matricula || matricula.length < 4 || matricula.length > 15) {
      return json({ error: "Matrícula inválida" }, 400);
    }
    if (!numero_poliza || numero_poliza.length < 4 || numero_poliza.length > 50) {
      return json({ error: "Número de póliza inválido" }, 400);
    }

    const { data: w, error } = await admin
      .from("warranties")
      .select(
        "id,numero_poliza,modalidad,estado,limite_averia,fecha_inicio,fecha_fin," +
          "vehiculo_marca,vehiculo_modelo,matricula,es_electrico,dealer_id,comprador_email",
      )
      .eq("matricula", matricula)
      .eq("numero_poliza", numero_poliza)
      .maybeSingle();

    if (error) return json({ error: "Error al consultar" }, 500);
    if (!w) return json({ error: "No encontramos ninguna póliza con esos datos." }, 404);

    const { data: dealer } = await admin
      .from("dealers")
      .select("nombre_empresa")
      .eq("id", w.dealer_id)
      .maybeSingle();

    const maskEmail = (e: string) => {
      const [u, d] = e.split("@");
      if (!d) return "•••";
      return `${u.slice(0, 1)}${"•".repeat(Math.max(2, u.length - 1))}@${d}`;
    };

    return json({
      warranty: {
        id: w.id,
        numero_poliza: w.numero_poliza,
        modalidad: w.modalidad,
        estado: w.estado,
        limite_averia: w.limite_averia,
        fecha_inicio: w.fecha_inicio,
        fecha_fin: w.fecha_fin,
        vehiculo_marca: w.vehiculo_marca,
        vehiculo_modelo: w.vehiculo_modelo,
        matricula: w.matricula,
        es_electrico: w.es_electrico,
      },
      dealer: dealer ? { nombre_empresa: dealer.nombre_empresa } : null,
      // Solo indica si es posible verificar por correo, con destino enmascarado.
      verification: {
        available: Boolean(w.comprador_email),
        hint: w.comprador_email ? maskEmail(String(w.comprador_email)) : null,
      },
    });
  } catch {
    return json({ error: "Error inesperado" }, 500);
  }
});

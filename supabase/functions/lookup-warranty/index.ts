import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const matricula = String(body?.matricula ?? "").toUpperCase().replace(/\s|-/g, "").trim();
    const numero_poliza = String(body?.numero_poliza ?? "").toUpperCase().trim();

    if (!matricula || matricula.length < 4 || matricula.length > 15) {
      return new Response(JSON.stringify({ error: "Matrícula inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!numero_poliza || numero_poliza.length < 4 || numero_poliza.length > 50) {
      return new Response(JSON.stringify({ error: "Número de póliza inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: w, error } = await supabase
      .from("warranties")
      .select(
        "id,numero_poliza,modalidad,estado,limite_averia,fecha_venta,fecha_inicio,fecha_fin," +
          "comprador_nombre,comprador_dni,comprador_telefono,comprador_email,comprador_direccion," +
          "comprador_cp,comprador_poblacion,comprador_provincia," +
          "vehiculo_marca,vehiculo_modelo,matricula,bastidor,fecha_matriculacion,km_venta," +
          "precio_venta,combustible,tipo_cambio,traccion_4x4,dealer_id",
      )
      .eq("matricula", matricula)
      .eq("numero_poliza", numero_poliza)
      .maybeSingle();

    if (error) {
      return new Response(JSON.stringify({ error: "Error al consultar" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!w) {
      return new Response(JSON.stringify({ error: "No encontramos ninguna póliza con esos datos." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Datos del concesionario para el contrato
    const { data: dealer } = await supabase
      .from("dealers")
      .select("nombre_empresa,cif")
      .eq("id", w.dealer_id)
      .maybeSingle();

    return new Response(
      JSON.stringify({
        warranty: w,
        dealer: dealer ?? null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: "Error inesperado" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
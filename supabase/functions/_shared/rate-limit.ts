import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

export const adminClient = (): SupabaseClient =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

export const clientIp = (req: Request): string =>
  (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim() || "unknown";

/**
 * Límite persistente en base de datos (sobrevive a reinicios y a varias instancias).
 * Devuelve true si la petición debe rechazarse.
 */
export async function isRateLimited(
  admin: SupabaseClient,
  bucket: string,
  subject: string,
  max: number,
  windowSeconds: number,
): Promise<boolean> {
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
  const { count } = await admin
    .from("rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("bucket", bucket)
    .eq("subject", subject)
    .gte("created_at", since);

  if ((count ?? 0) >= max) return true;

  await admin.from("rate_limits").insert({ bucket, subject });
  // Limpieza oportunista de registros antiguos
  if (Math.random() < 0.05) {
    await admin
      .from("rate_limits")
      .delete()
      .lt("created_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString());
  }
  return false;
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const normalizePlate = (v: unknown) =>
  String(v ?? "").toUpperCase().replace(/\s|-/g, "").trim();
export const normalizePolicy = (v: unknown) => String(v ?? "").toUpperCase().trim();

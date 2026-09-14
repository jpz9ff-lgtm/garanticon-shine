import { createClient } from "npm:@supabase/supabase-js@2";
import {
  adminClient,
  clientIp,
  corsHeaders,
  isRateLimited,
  json,
  sha256,
} from "../_shared/rate-limit.ts";

/**
 * Inicio de sesión de profesionales. La resolución de nombre de usuario a correo
 * ocurre íntegramente dentro del proceso de autenticación: nunca se devuelve el
 * correo ni se confirma la existencia de una cuenta. Errores siempre genéricos.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const admin = adminClient();
  const ip = clientIp(req);
  const GENERIC = { error: "Credenciales incorrectas" };

  try {
    const body = await req.json();
    const identifier = String(body?.identifier ?? "").trim();
    const password = String(body?.password ?? "");
    if (!identifier || !password) return json(GENERIC, 400);

    if (await isRateLimited(admin, "dealer-login-ip", ip, 10, 600)) {
      return json({ error: "Demasiados intentos. Inténtalo más tarde." }, 429);
    }
    if (await isRateLimited(admin, "dealer-login-id", await sha256(identifier.toLowerCase()), 5, 600)) {
      return json({ error: "Demasiados intentos. Inténtalo más tarde." }, 429);
    }

    let email = identifier;
    if (!identifier.includes("@")) {
      const { data } = await admin
        .from("dealers")
        .select("email")
        .ilike("username", identifier)
        .maybeSingle();
      if (!data?.email) return json(GENERIC, 400);
      email = data.email;
    }

    const anon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { auth: { persistSession: false } },
    );
    const { data: signIn, error } = await anon.auth.signInWithPassword({ email, password });
    if (error || !signIn.session) return json(GENERIC, 400);

    // Cuenta desactivada: se corta el acceso y se invalida la sesión recién creada
    const { data: dealer } = await admin
      .from("dealers")
      .select("activo")
      .eq("user_id", signIn.user!.id)
      .maybeSingle();

    if (dealer && dealer.activo === false) {
      await admin.auth.admin.signOut(signIn.session.access_token, "global").catch(() => {});
      return json({ error: "Tu cuenta está desactivada. Contacta con info@garanticon.es." }, 403);
    }

    return json({
      session: {
        access_token: signIn.session.access_token,
        refresh_token: signIn.session.refresh_token,
      },
    });
  } catch {
    return json(GENERIC, 400);
  }
});

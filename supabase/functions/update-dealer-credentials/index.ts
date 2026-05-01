import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    if (!jwt) return json({ error: "No autenticado" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData.user) return json({ error: "Sesión no válida" }, 401);
    const userId = userData.user.id;

    const body = await req.json();
    const { email, password, username, currentPassword } = body as {
      email?: string;
      password?: string;
      username?: string;
      currentPassword?: string;
    };

    // Verify current password (re-auth) before any sensitive change
    if (!currentPassword) return json({ error: "Debes introducir tu contraseña actual" }, 400);
    const verifyClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { error: signInErr } = await verifyClient.auth.signInWithPassword({
      email: userData.user.email!,
      password: currentPassword,
    });
    if (signInErr) return json({ error: "Contraseña actual incorrecta" }, 403);

    // Check username uniqueness
    if (username) {
      const { data: existing } = await admin
        .from("dealers")
        .select("user_id")
        .ilike("username", username.trim())
        .maybeSingle();
      if (existing && existing.user_id !== userId) {
        return json({ error: "Ese nombre de usuario ya está en uso" }, 400);
      }
    }

    // Update auth user (email/password)
    const updates: Record<string, unknown> = {};
    if (email) updates.email = email.trim().toLowerCase();
    if (password) updates.password = password;
    if (Object.keys(updates).length > 0) {
      // email_confirm so the new email is immediately usable
      if (updates.email) (updates as { email_confirm?: boolean }).email_confirm = true;
      const { error: updErr } = await admin.auth.admin.updateUserById(userId, updates);
      if (updErr) return json({ error: updErr.message }, 400);
    }

    // Update dealer row (username + email mirror)
    const dealerUpdates: Record<string, unknown> = {};
    if (username) dealerUpdates.username = username.trim();
    if (email) dealerUpdates.email = email.trim().toLowerCase();
    if (Object.keys(dealerUpdates).length > 0) {
      const { error: dErr } = await admin
        .from("dealers")
        .update(dealerUpdates)
        .eq("user_id", userId);
      if (dErr) return json({ error: dErr.message }, 400);
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
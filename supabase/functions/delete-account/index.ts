// Edge Function: delete-account
// AVG: recht op verwijdering. Verwijdert alle foto's in storage en daarna de auth-gebruiker;
// alle tabellen hangen met ON DELETE CASCADE aan auth.users, dus alle rijen gaan mee.
import { createClient } from "@supabase/supabase-js";

const BUCKET = "scan-photos";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(null, { status: 405, headers: cors });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(null, { status: 401, headers: cors });

  const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return new Response(null, { status: 401, headers: cors });
  const userId = data.user.id;

  // Service role alleen hier, alleen server-side, alleen voor deze ene gebruiker.
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Alle foto's van deze gebruiker (structuur <user>/<scan>/<n>.jpg).
  const { data: scanFolders } = await admin.storage.from(BUCKET).list(userId, { limit: 1000 });
  for (const folder of scanFolders ?? []) {
    const { data: files } = await admin.storage.from(BUCKET).list(`${userId}/${folder.name}`, { limit: 100 });
    const paths = (files ?? []).map((f) => `${userId}/${folder.name}/${f.name}`);
    if (paths.length) await admin.storage.from(BUCKET).remove(paths);
  }

  const { error: delError } = await admin.auth.admin.deleteUser(userId);
  if (delError) {
    console.error("delete-account failed", delError.message);
    return new Response(JSON.stringify({ error: "internal" }), { status: 500, headers: cors });
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
});

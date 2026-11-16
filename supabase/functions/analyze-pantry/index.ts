// Edge Function: analyze-pantry
// Enige plek (samen met latere AI-functies) die de Claude API aanroept. De API-sleutel staat
// als Supabase-secret (ANTHROPIC_API_KEY) op de server en komt nooit in de app.
//
// Stroom: app uploadt foto's naar privé-bucket -> roept deze functie aan met scan_id ->
// functie leest foto's (met de JWT van de gebruiker, dus RLS geldt) -> Claude vision ->
// zod-gevalideerde ingrediëntenlijst -> opslaan in scans.detected -> foto's direct verwijderen.
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { createClient } from "@supabase/supabase-js";
import { encodeBase64 } from "@std/encoding/base64";
import { AnalyzeRequestSchema, MAX_PHOTOS_PER_SCAN, PantryAnalysisSchema } from "../_shared/schemas.ts";
import { mergeDetections } from "../_shared/pantry.ts";
import { corsHeaders, fail, json } from "../_shared/http.ts";

const BUCKET = "scan-photos";
const MODEL = "claude-opus-5-5";

const SYSTEM_PROMPT = `Je herkent etenswaren op foto's van een koelkast, vriezer of voorraadkast voor een Nederlandse kookapp.

Regels:
- Noem alleen eetbare producten en ingrediënten die je echt ziet. Negeer schoonmaakmiddelen, medicijnen, verpakkingsmateriaal en non-food.
- Gebruik gewone Nederlandse productnamen in enkelvoud en kleine letters ("paprika", "halfvolle melk", "tomatenblokjes in blik", "pasta"). Geen merknamen.
- Hetzelfde product op meerdere foto's noem je één keer.
- Categorie: vegetables (groente, ook peulvruchten in blik als groente), fruit, protein (vlees, vis, ei, tofu, tempeh, gedroogde peulvruchten), dairy (melk, yoghurt, kaas, kwark), carbs (brood, pasta, rijst, aardappel, ontbijtgranen, wraps), fat_sauce (olie, boter, sauzen, dressings, pesto, mayonaise), other (kruiden, specerijen, drinken, snoep, overig).
- Hoeveelheid alleen grof: lots (veel), some (weinig), little (een beetje / bijna op). Nooit grammen of aantallen.
- confident=false als je twijfelt wat het product is (bv. ondoorzichtige bak, onleesbaar etiket). Benoem het dan zo goed mogelijk, bv. "restje (onbekend) in bakje".
- Doe geen uitspraken over gezondheid of voedingswaarde.
- photo_quality_note: alleen invullen als foto's te donker, wazig of te ver weg zijn om goed te herkennen; anders null.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return fail("bad_request", 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return fail("unauthorized", 401);

  // Client met de JWT van de gebruiker: alle reads/writes vallen onder RLS.
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return fail("unauthorized", 401);

  const parsedBody = AnalyzeRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsedBody.success) return fail("bad_request", 400);
  const scanId = parsedBody.data.scan_id;

  const { data: scan, error: scanError } = await supabase
    .from("scans")
    .select("id, photo_paths, status")
    .eq("id", scanId)
    .single();
  if (scanError || !scan) return fail("not_found", 404);

  const paths: string[] = scan.photo_paths ?? [];
  if (paths.length === 0) return fail("no_photos", 400);
  if (paths.length > MAX_PHOTOS_PER_SCAN) return fail("too_many_photos", 400);
  // Extra controle bovenop storage-RLS: paden moeten in de map van deze gebruiker liggen.
  if (!paths.every((p) => p.startsWith(`${userData.user.id}/${scanId}/`))) return fail("bad_request", 400);

  await supabase.from("scans").update({ status: "analyzing", error: null }).eq("id", scanId);

  try {
    const images = await Promise.all(
      paths.map(async (path) => {
        const { data, error } = await supabase.storage.from(BUCKET).download(path);
        if (error || !data) throw new Error(`download failed: ${path}`);
        return encodeBase64(new Uint8Array(await data.arrayBuffer()));
      }),
    );

    const client = new Anthropic(); // leest ANTHROPIC_API_KEY uit de omgeving van de Edge Function
    const response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 8000,
      // Herkenning is een eenvoudige taak; lage effort houdt de wachttijd kort.
      output_config: { effort: "low", format: betaZodOutputFormat(PantryAnalysisSchema) },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            ...images.map((data) => ({
              type: "image" as const,
              source: { type: "base64" as const, media_type: "image/jpeg" as const, data },
            })),
            {
              type: "text",
              text: `Dit ${images.length === 1 ? "is 1 foto" : `zijn ${images.length} foto's`} van dezelfde voorraad. Geef de ingrediëntenlijst.`,
            },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens" || !response.parsed_output) {
      console.error("analyze-pantry: unusable response", response.stop_reason);
      await markFailed(supabase, scanId, `unusable: ${response.stop_reason}`);
      await deletePhotos(supabase, scanId, paths);
      return fail("ai_unreadable", 502);
    }

    const analysis = response.parsed_output;
    const ingredients = mergeDetections(analysis.ingredients);

    await supabase.from("scans").update({ status: "analyzed", detected: ingredients }).eq("id", scanId);
    // Privacy: foto's niet langer bewaren dan nodig. Na analyse direct weg.
    await deletePhotos(supabase, scanId, paths);

    return json({ scan_id: scanId, ingredients, photo_quality_note: analysis.photo_quality_note });
  } catch (err) {
    console.error("analyze-pantry failed", err instanceof Error ? err.message : err);
    await markFailed(supabase, scanId, err instanceof Anthropic.APIError ? `api ${err.status}` : "internal");
    // Bij een fout bewaren we de foto's ook niet: de gebruiker kan opnieuw scannen.
    await deletePhotos(supabase, scanId, paths);
    if (err instanceof Anthropic.APIError) return fail("ai_unavailable", 503);
    return fail("internal", 500);
  }
});

// deno-lint-ignore no-explicit-any
async function deletePhotos(supabase: any, scanId: string, paths: string[]) {
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) {
    console.error("photo delete failed", scanId, error.message);
    return;
  }
  await supabase.from("scans").update({ photo_paths: [], photos_deleted_at: new Date().toISOString() }).eq("id", scanId);
}

// deno-lint-ignore no-explicit-any
async function markFailed(supabase: any, scanId: string, error: string) {
  await supabase.from("scans").update({ status: "failed", error }).eq("id", scanId);
}

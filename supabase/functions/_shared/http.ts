// Kleine HTTP-helpers voor Edge Functions.
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Foutcodes zijn stabiel; de app vertaalt ze via i18n. Nooit interne details naar de client. */
export type ErrorCode =
  | "unauthorized"
  | "bad_request"
  | "not_found"
  | "too_many_photos"
  | "no_photos"
  | "ai_unavailable"
  | "ai_unreadable"
  | "internal";

export function fail(code: ErrorCode, status: number): Response {
  return json({ error: code }, status);
}

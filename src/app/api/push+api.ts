/**
 * Push dispatch endpoint — DEPRECATED. Canonical path is the Supabase Edge
 * Function `send-push` (see supabase/functions/send-push). This route is
 * retained only for backwards-compat and will return 410 in the next release.
 * Requires a valid service bearer token on EVERY request — it fails closed.
 * Intended to be called by the send-push Edge Function / trusted backend
 * only, never by clients.
 *
 * SECURITY:
 * - When SUPABASE_SERVICE_ROLE_KEY is not configured this endpoint rejects
 *   everything rather than becoming an open relay.
 * - Bearer comparison is constant-time to avoid leaking the secret through
 *   early-exit timing.
 * - Push tokens are validated against the full Expo token shape before any
 *   upstream call, so garbage payloads never burn Expo quota.
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/** Expo device tokens are `ExponentPushToken[` + 22 chars + `]`. */
const EXPO_PUSH_TOKEN_PATTERN = /^ExponentPushToken\[[A-Za-z0-9_-]{22}\]$/;

/**
 * Length-checked, early-exit-free string comparison. Runs in time proportional
 * to the reference value regardless of where a mismatch occurs.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

interface ExpoTicket {
  status?: string;
  message?: string;
}

export function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Fail closed: without the secret configured, nothing may dispatch.
  if (!serviceRoleKey) {
    return Response.json(
      { error: "Push dispatch is not configured." },
      { status: 503, headers: corsHeaders }
    );
  }

  const expected = `Bearer ${serviceRoleKey}`;
  if (
    typeof authHeader !== "string" ||
    !timingSafeEqual(authHeader, expected)
  ) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401, headers: corsHeaders }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Malformed JSON body." },
      { status: 400, headers: corsHeaders }
    );
  }

  const { to, title, message, data } =
    (body as Record<string, unknown> | null) ?? {};

  if (!to || !title || !message) {
    return Response.json(
      { error: "Missing required fields: to, title, message" },
      { status: 400, headers: corsHeaders }
    );
  }

  // Strict payload hygiene before forwarding upstream.
  if (typeof to !== "string" || !EXPO_PUSH_TOKEN_PATTERN.test(to)) {
    return Response.json(
      { error: "Invalid push token format" },
      { status: 422, headers: corsHeaders }
    );
  }

  let pushResponse: Response;
  try {
    pushResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        to,
        title: String(title).slice(0, 120),
        body: String(message).slice(0, 500),
        data: typeof data === "object" && data !== null ? data : {},
        sound: "default",
        priority: "high",
      }),
    });
  } catch {
    // Upstream unreachable — report honestly so callers can retry.
    return Response.json(
      { success: false, error: "Upstream push service unreachable." },
      { status: 502, headers: corsHeaders }
    );
  }

  let pushResult: { data?: ExpoTicket | ExpoTicket[] } | null = null;
  try {
    pushResult = await pushResponse.json();
  } catch {
    pushResult = null;
  }

  const rawTicket = Array.isArray(pushResult?.data)
    ? pushResult?.data?.[0]
    : pushResult?.data;
  const ticket: ExpoTicket | undefined = rawTicket;

  const delivered =
    pushResponse.ok && ticket?.status === "ok";

  if (!delivered) {
    return Response.json(
      {
        success: false,
        error:
          ticket?.message ??
          `Upstream push service responded with HTTP ${pushResponse.status}.`,
        result: pushResult,
      },
      { status: 502, headers: corsHeaders }
    );
  }

  return Response.json(
    { success: true, result: pushResult },
    { status: 200, headers: corsHeaders }
  );
}

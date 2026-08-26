/**
 * Health endpoint for uptime monitors / load balancers. Returns only
 * non-sensitive metadata — never env vars, keys, or connection strings.
 * A separate `/api/ready` would probe dependencies (Supabase) if wired to
 * a backend runtime; this static probe is intentionally side-effect free.
 */
export function GET() {
  const timestamp = new Date().toISOString();

  return Response.json(
    {
      status: "ok",
      service: "educard-api",
      version: process.env.EXPO_PUBLIC_APP_VERSION || "1.0.0",
      timestamp,
      environment: process.env.NODE_ENV || "production",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Content-Type": "application/json",
        // Basic hardening — no referrer leak, no framing.
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      },
    }
  );
}

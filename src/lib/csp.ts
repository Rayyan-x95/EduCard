/**
 * Content Security Policy (CSP) specification for EduCard Web.
 *
 * Restricts executable scripts, stylesheets, network connections, and frame
 * embedding to verified EduCard infrastructure and essential third-party APIs.
 */

export const CSP_DIRECTIVES = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", "'wasm-unsafe-eval'"],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "blob:", "https:"],
  "font-src": ["'self'", "data:"],
  "connect-src": [
    "'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://exp.host",
    "https://us.i.posthog.com",
    "https://*.sentry.io",
  ],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
} as const;

export function buildCspHeader(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => `${directive} ${sources.join(" ")}`)
    .join("; ");
}

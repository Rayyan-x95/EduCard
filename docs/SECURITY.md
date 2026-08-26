# Security and Privacy

## Threat model

Assume:
- Mobile clients can be modified.
- API requests can be replayed.
- Users can attempt privilege escalation.
- Tokens can be stolen.
- Malicious users will create spam/abuse.
- Uploaded files may be hostile.

## Authentication

Use Supabase Auth.

Never:
- Store passwords yourself.
- Put service-role keys in the app.
- Trust client role claims without server verification.

## Authorization

Enforce access with PostgreSQL RLS.

### Hardening decisions (2026-08 audit)

- **Sensitive profile guard uses the effective DB role, not the JWT claim.**
  `protect_sensitive_profile_fields` checks `current_user = 'authenticated'`.
  SECURITY DEFINER RPCs (which run as `postgres`) can therefore maintain
  reputation/counters, while direct client writes stay blocked. Testing the JWT
  role instead had broken `accept_answer` end-to-end.
- **`answers.is_accepted` can only change via RPC.** A BEFORE UPDATE trigger
  rejects direct flips by any client role, closing a self-accept bypass of
  answer RLS.
- **Verification requests are policy-split.** Owners INSERT/SELECT/DELETE their
  own *pending* rows; only admins may UPDATE status/review fields (previously a
  user could self-verify via FOR ALL).
- **Attachments bucket is private.** Reads require an authenticated session or a
  short-lived signed URL (`StorageService.getSignedAttachmentUrls`). Avatars stay
  public by design.
- **`/api/push` fails closed** without `SUPABASE_SERVICE_ROLE_KEY`; with it set,
  bearer auth + token-format validation apply (no open push relay).
- **Reports carry no spoofable identity:** `reporter_id` is required and verified
  by `WITH CHECK reporter_id = auth.uid()`.

Every table containing user data must have an explicit policy strategy.

## Secrets

Client-safe:
- Supabase project URL
- Supabase anon/publishable key

Server-only:
- Service role key
- Resend API key
- Sentry secrets
- privileged verification credentials

Use environment variables and secret stores.

## Storage

- Validate file type and size.
- Restrict upload paths.
- Do not allow arbitrary object access.
- Generate signed URLs when appropriate.

## Privacy

Collect only what is necessary.

Avoid requiring:
- Exact address
- Phone number
- Date of birth
- Sensitive demographic data

Provide:
- Account deletion
- Data export plan
- Privacy settings
- Content deletion
- Blocking

## Abuse prevention

Implement:
- Rate limiting
- Report controls
- Account restrictions
- Suspicious activity logging
- Moderation queue

## Mobile security

- Secure auth session storage.
- Avoid logging tokens.
- Do not log private user content unnecessarily.
- Disable verbose production logging.
- Use HTTPS-only services.

### Web session storage tradeoff (2026-08)

On web, the Supabase JWT lives in `localStorage`
(`src/lib/supabase.ts` `ExpoSecureStoreAdapter`), because Expo Router's
SPA-style output has no server session to hold an httpOnly cookie. This means
a successful XSS could exfiltrate a session token.

Mitigations in place:
- React Native auto-escapes all rendered strings — no raw HTML sinks exist today
  (`dangerouslySetInnerHTML` is never used; search input is sanitized before
  PostgREST `ilike`).
- No third-party script origins are loaded by the app bundle.
- RLS limits what any stolen token can read to exactly that user's scope.

Residual risk & roadmap:
1. Add a strict `Content-Security-Policy` header on the deployed web dist
   (`script-src 'self'`; no `unsafe-inline`) at the CDN/host layer. This is the
   single highest-leverage control and is config-only once hosting is chosen.
2. If server-rendered pages or cookie-based sessions land (e.g. via
   `@supabase/ssr` + API routes), migrate web auth to httpOnly cookies and
   drop localStorage entirely.

Do not ship user-generated rich text/HTML rendering without revisiting this
section first.

## Security testing

Before launch:
- Review all RLS policies.
- Test unauthorized CRUD operations.
- Test object storage access.
- Test account deletion.
- Test blocked-user interactions.
- Test moderator privilege boundaries.
- Run dependency auditing.

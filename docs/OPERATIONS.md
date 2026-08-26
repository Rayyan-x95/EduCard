# Production Operations

## Environments

Maintain:
- local
- staging
- production

Never develop directly against production.

## Configuration

Each environment has separate:
- Supabase project
- database
- storage
- auth configuration
- analytics environment
- notification configuration

## CI/CD

Pull request:
- typecheck
- lint
- tests
- build validation

Main branch:
- staging deployment/build

Release:
- production EAS build
- store submission
- database migration
- release notes

## Database migrations

All schema changes must be migrations.

Never manually edit production schema without recording the change.

Migration process:
1. Create migration.
2. Test locally.
3. Apply staging.
4. Run integration tests.
5. Apply production.
6. Verify.

Current migrations:
- `20260826000000_initial_schema.sql` — full schema, RLS, RPCs, storage buckets, indexes.
- `20260827000000_audit_fixes.sql` — security hardening (see docs/SECURITY.md), topic seeds,
  profile preference + `onboarding_completed` columns, author-counter triggers,
  `check_username_available` RPC, `client_error_reports` table, notifications.`push_sent_at`.

`supabase/scripts/setup_database.sql` was removed: it was a byte-for-byte duplicate of
the initial migration and drifted. The migrations directory is the single source of truth.

## Supabase Auth URL configuration

The password-reset email links back into the app via the `educard` scheme:

1. In Supabase Dashboard → Authentication → URL Configuration:
   - Site URL: your production web origin (or app deep link).
   - Add redirect allow-list entry matching `<scheme>://*(auth)/reset-password`
     (dev builds use the Expo Go / dev-client form of that URL).
2. The client calls `resetPasswordForEmail(email, { redirectTo })` using
   `Linking.createURL("/(auth)/reset-password")`.
3. On open, `PASSWORD_RECOVERY` auth event routes to `(auth)/reset-password`.

Without an allow-listed redirect the reset link opens a Supabase page and cannot
complete inside the app.

## Push delivery runbook

In-app notification rows are created by database triggers; device delivery is
performed by the `send-push` Edge Function:

```bash
supabase functions deploy send-push --no-verify-jwt
supabase secrets set SEND_PUSH_WEBHOOK_SECRET=<random 32+ byte value>  # REQUIRED
supabase secrets set EXPO_ACCESS_TOKEN=<token>     # optional, recommended
```

**`SEND_PUSH_WEBHOOK_SECRET` is mandatory.** The function fails closed (503)
without it and rejects every request that does not carry the matching
`x-send-push-secret` header — the JWT verify step is disabled by deploy flag,
so this shared secret is the only gate. Generate one with
`openssl rand -base64 32`.

Trigger it either way:

- **Webhook:** Database → Webhooks → on `INSERT` of `public.notifications`,
  POST to `https://<project>.functions.supabase.co/send-push` with header
  `x-send-push-secret: <SEND_PUSH_WEBHOOK_SECRET>`.
- **Sweep:** call the function from a scheduled job with the same header — it
  processes any rows with `push_sent_at IS NULL` (limit 100).

Delivery bookkeeping: `push_sent_at` is stamped only when Expo accepts the
ticket (`status === "ok"`) or when the failure is terminal
(`DeviceNotRegistered`). Transient failures leave rows unsent so the sweep
retries without duplicates.

Recipients' preferences (`answer_notifications`, `dm_notifications`) are honoured
by the function before dispatch. Tokens come from `push_tokens`; Android requires
the `expo-notifications` plugin config already present in `app.json`, plus FCM
credentials set in EAS when building.

## Push dispatch API route

`/api/push` is server-to-server only. It **fails closed**: if
`SUPABASE_SERVICE_ROLE_KEY` is not set in the hosting environment it returns 503
for every request; otherwise it requires `Authorization: Bearer <key>`. Configure
that secret wherever the web output is hosted (e.g. EAS Hosting environment
variables) or leave it unset to disable dispatch entirely.

## Backups

Enable automated database backups.

Define:
- Recovery Point Objective
- Recovery Time Objective
- restoration procedure

Test restoration periodically.

## Monitoring

Monitor:
- app crashes
- API/database errors
- slow queries
- authentication failures
- notification failures
- storage failures
- moderation queue size

## Incident severity

P0: security breach/data loss/complete outage.

P1: major core functionality unavailable.

P2: significant degraded functionality.

P3: minor defect.

## Release rollback

Mobile releases cannot always be instantly rolled back. Prefer:
- feature flags
- server-side kill switches
- backward-compatible migrations
- emergency configuration changes

## Operational rule

If a system cannot be observed, it cannot be safely operated.

## Backup and recovery

Supabase (managed Postgres) provides automated daily backups on paid tiers;
verify the retention window in the Supabase dashboard for each environment.
Supplementary expectations:

- **What happens if the database disappears?** Restore from the most recent
  Supabase backup into a new project, then update EXPO_PUBLIC_SUPABASE_URL
  / EXPO_PUBLIC_SUPABASE_ANON_KEY (and server-side
  SUPABASE_SERVICE_ROLE_KEY, SEND_PUSH_WEBHOOK_SECRET). Storage buckets
  (vatars, ttachments, erification) are NOT included in database
  backups — mirror them externally if their loss is unacceptable.
- **What happens if a migration fails?** Migrations are append-only and never
  rewritten. A failing migration aborts mid-transaction (each file runs in a
  single transaction), leaving prior migrations applied. Fix forward with a
  new migration; never reset production to repair drift.
- **What happens if a deployment is bad?** Web bundles are exported per CI
  run and retained as artifacts; redeploy the previous artifact. Mobile
  release rollback follows the kill-switch guidance above.
- **What happens if storage is corrupted?** Buckets cannot be restored from
  database backups. Re-upload flows exist for avatars (per-user cleanup +
  re-pick); attachment/evidence loss requires users to re-attach.

## Data retention

Scheduled daily at 03:00 UTC via pg_cron (educard-retention-purge job),
implemented by public.purge_expired_operational_data() in migration
20260906000000_retention_and_abuse_guards.sql. If pg_cron is unavailable in
an environment, invoke that function from any external scheduler.

| Table | Rule |
| --- | --- |
| notifications | purge read rows after 90 days; unread safety-net purge at 180 days |
| reports | purge resolved/dismissed rows after 180 days; open reports are kept |
| moderation_audit_logs | purge after 365 days |
| client_error_reports | purge after 30 days |

Deletes are batched (5,000 rows per statement, FOR UPDATE SKIP LOCKED) so a
purge run cannot hold long locks or starve OLTP traffic.

## Error-report abuse guards

Inserts into client_error_reports are rate limited by trigger:
authenticated users may file up to 20 reports per 10 minutes; anonymous
writers share a global budget of 30 per 5 minutes. Client telemetry treats a
rejected persist as non-fatal (single retry, then drop).

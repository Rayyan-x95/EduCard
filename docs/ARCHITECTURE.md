# Technical Architecture

## 1. Architecture

EduCard uses a mobile-first client with a managed backend.

Expo/React Native
→ Supabase client
→ PostgreSQL/Auth/Storage/Realtime
→ Edge Functions for privileged workflows
→ external services for email, analytics, monitoring and push.

## 2. Client

- Expo
- React Native
- TypeScript
- Expo Router
- TanStack Query for server state
- Zustand for local UI state
- React Hook Form + Zod
- NativeWind

## 3. Folder structure

src/
  app/
    (auth)/
    (onboarding)/
    (tabs)/
    question/
    post/            # discussion detail + comments
    community/
    user/            # public scholar profile + follow
    search/
    settings/
    bookmarks.tsx
    report.tsx
    api/             # health+api, push+api (fail-closed)
  components/
    ui/
    domain/
  lib/               # supabase, query-client, analytics, telemetry, errors
  hooks/
  stores/
  services/
  types/
  constants/

Note: this reflects the actual code. Earlier revisions of this document listed a
planned `features/` layout that was never introduced; trust `src/` over this
document if they disagree again.

## 4. Data flow

Read:
Screen → TanStack Query → Supabase → PostgreSQL → normalized view model → UI

Write:
Form → Zod validation → mutation → Supabase/RPC/Edge Function → database → cache invalidation → UI

Privileged operation:
Client → Edge Function → authorization → operation → database → response.

## 5. State rules

Server data belongs in TanStack Query.

Local UI state belongs in Zustand or component state.

Do not copy server entities into Zustand unless there is a strong reason.

## 6. Security boundary

The client is untrusted.

Database permissions are enforced using Row Level Security.

Privileged workflows live in SECURITY DEFINER SQL RPCs (accept/unaccept answer,
onboarding, community creation, moderation, account deletion). These RPCs run as
the function owner, so triggers that guard sensitive fields must test the
effective database role (`current_user`), not the JWT role claim — see
`protect_sensitive_profile_fields` in the audit-fixes migration for the pattern
and docs/SECURITY.md for rationale.

Never place service-role credentials in the mobile application.

## 7. Realtime

Use realtime selectively:
- Notifications
- New answers/comments where useful
- Future messaging

Do not make the entire home feed realtime.

## 8. Media

Images are stored in Supabase Storage.

Use deterministic object paths and enforce ownership policies.

Future video can move to a dedicated video platform.

## 9. Caching

Recommended:
- Feed: short-lived cache
- Profile: moderate cache
- Community metadata: longer cache
- Question detail: invalidate after answer/comment mutation

## 10. Scaling strategy

Stage 1: Supabase-only architecture.

Stage 2: optimize indexes, RPCs, pagination and caching.

Stage 3: add dedicated search infrastructure only when measured need exists.

Stage 4: extract specialized services only when a real bottleneck justifies it.

Do not introduce microservices preemptively.

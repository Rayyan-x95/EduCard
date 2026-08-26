# Quality Assurance Strategy

## Current suite (verified)

`npm run test` — Vitest, node environment, 18 files / 65 tests, all green.
Coverage: services layer (questions, posts, comments, follows, communities,
bookmarks, safety, topics, notifications, storage, search, auth), stores,
query-client, env parsing, error normalization, telemetry persistence, native
wrappers, and API routes including push fail-closed auth.

Expo native modules are mocked per-file via `vi.mock("expo-*", ...)`.
Run a single file: `npx vitest run src/__tests__/lib/query-client.test.ts`.

CI order: typecheck → lint → tests → `npm audit --audit-level=critical`
(currently exit 0 after tar/@remix-run overrides) → `expo export --platform web`.

### Known gaps (tracked)

- No RLS/policy integration tests against a live Postgres — highest-value next
  addition (pgTAP or supabase test helpers).
- No E2E journey automation; no component rendering tests (node env by design).
- Runtime device verification of push delivery requires the `send-push`
  deployment in docs/OPERATIONS.md.

## Testing pyramid

### Unit tests
Use for:
- Validation schemas
- Feed ranking logic
- Utility functions
- Permission helpers

### Integration tests
Use for:
- Auth flows
- Supabase queries
- Mutations
- Notification creation
- RLS behavior

### E2E tests
Cover:
- Signup
- Onboarding
- Create question
- Answer question
- Mark solved
- Join community
- Follow user
- Report content
- Block user

## Critical security tests

For every table:
- Anonymous read/write
- Authenticated wrong-user write
- Correct-owner write
- Moderator access
- Blocked-user behavior

## Device matrix

At minimum:
- Current supported iPhone
- Older supported iPhone
- Small Android device
- Mid-range Android
- Large Android
- Different OS versions supported by Expo target

## Release gates

Do not ship if:
- Auth is broken.
- RLS has known bypasses.
- Crash rate spikes.
- Question creation is broken.
- Push notifications cause crashes.
- Critical moderation/reporting is unavailable.
- Data migration is untested.

## Regression suite

Run before every production release:
- lint
- typecheck
- unit tests
- integration tests
- E2E smoke tests
- dependency audit
- production build

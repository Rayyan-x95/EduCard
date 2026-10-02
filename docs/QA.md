# Quality Assurance Strategy

## Current suite (verified)

`npm run test` — Vitest, node environment, 25 files / 131 tests, all green.
Coverage: services layer (questions, posts, comments, follows, communities,
bookmarks, safety, topics, notifications, storage, search, auth), stores,
drafts system (questions & posts autosave/recovery/expiration), query-client,
env parsing, error normalization, telemetry persistence, native wrappers,
API routes including push fail-closed auth, CSP builder, mutation idempotency
guards, and push-hardening regression tests.

Expo native modules are mocked per-file via `vi.mock("expo-*", ...)`.
Run a single file: `npx vitest run src/__tests__/lib/query-client.test.ts`.

Additional security harness: `npm run test:security` executes SEC-01 through
SEC-11 RLS/integrity checks against a live Supabase database (requires `.env`
with valid credentials).

CI order: typecheck → lint → tests → `npm audit --audit-level=critical`
(currently exit 0 after tar/@remix-run overrides) → `expo export --platform web`.

### Known gaps (tracked)

- RLS/policy live tests run via `npm run test:security` (requires live credentials)
  and are not yet part of CI — highest-value CI addition pending secrets setup.
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
- Reputation badges calculation
- Duplicate question similarity detection
- Smart notification grouping

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

- lint (`npm run lint` -> 0 errors, 0 warnings)
- typecheck (`npm run typecheck` -> 0 errors)
- unit tests (`npm run test` -> 28 files / 145 tests passing)
- export build (`npx expo export --platform web --output-dir dist` -> all routes bundled)
- dependency audit (`npm audit --audit-level=critical`)

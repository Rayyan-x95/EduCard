# AGENTS.md

EduCard: cross-platform student Q&A/knowledge network. Expo SDK 52 + React Native 0.74 + TypeScript strict, Expo Router v3, Supabase backend, NativeWind/Tailwind styling.

## Commands

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint . --ext .js,.jsx,.ts,.tsx
npm run test        # vitest run (18 files / 65 tests)
npm run android|ios|web   # expo dev servers
```

CI runs exactly this order: typecheck → lint → test → `npm audit --audit-level=critical` → `npx expo export --platform web --output-dir dist` with placeholder env vars (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`). The audit gate passes via package.json `overrides` (tar ≥7.5.21, @remix-run/* ^2.17.1); do not remove them.

Run one test file: `npx vitest run src/__tests__/lib/query-client.test.ts`

## Environment

- Required: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (copy `.env.example`). Optional: PostHog key (REST transport — no SDK), Sentry DSN (reserved).
- Env is parsed with zod **at import time** in `src/constants/env.ts` — missing/invalid values throw when any module importing `supabase.ts` loads, including some tests.
- Legacy `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` names still work as fallbacks.
- `/api/push` fails closed without `SUPABASE_SERVICE_ROLE_KEY` set on the server — that's intentional; see docs/OPERATIONS.md.

## Testing quirks

- Vitest runs in **node** environment (no jsdom/DOM) with `react-native` aliased to `react-native-web` (`vitest.config.mts`). Only pure logic/services/stores/lib code is tested.
- Expo native modules are not auto-mocked; each test file mocks them explicitly via `vi.mock("expo-*", ...)`. Tests importing anything that touches supabase must also mock `@/lib/supabase`.
- Path alias `@/` → `src/`.

## Architecture & conventions

- Routing in `src/app/`: groups `(auth)`, `(onboarding)`, `(tabs)`; guards centralized in `src/app/_layout.tsx` (`AuthProtectedRoute`, PASSWORD_RECOVERY deep-link handling). Feed is keyset-paginated via `useInfiniteQuery` over the `get_home_feed` RPC and renders both questions AND posts by `item_type`.
- Layering: screens → `src/services/*` → TanStack Query for server state. Zustand (`src/stores/`) only for local UI/auth session state. Screens must not call `supabase` directly (edit-profile/notifications were cleaned up — keep it that way).
- User-facing error messages come from `normalizeError()` in `src/lib/errors.ts`. Never surface raw Supabase/Postgres messages. App-thrown errors use human text + `code: "APP_ERROR"`.
- Supabase types live hand-maintained in `src/types/database.ts`. When editing `supabase/migrations/*.sql`, sync tables/enums/**Functions/RPC signatures** there — nothing regenerates it. Migrations are the single source of truth (`supabase/scripts/` was deleted for drift).
- Security model: RLS + SECURITY DEFINER RPCs enforce everything. Guards that protect profile fields check `current_user = 'authenticated'` (NOT the JWT role) so definer RPCs can do maintenance — preserve this pattern or accept/unaccept breaks again. See docs/SECURITY.md.
- Topics table is seeded by migration `20260827000000_audit_fixes.sql`; never fabricate client-side fallback UUIDs (that broke fresh deployments before).

## Docs

`docs/*.md` are the authoritative product/architecture specs (PRD, ARCHITECTURE, DATABASE, SECURITY, QA, OPERATIONS, etc.). OPERATIONS.md contains the push-delivery runbook (`supabase/functions/send-push`) and Supabase Auth redirect config. ARCHITECTURE.md now matches the real tree; if docs and `src/` disagree, trust `src/`.

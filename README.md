# EduCard — Global Student Knowledge Network

EduCard is a cross-platform social knowledge network for students. Students can ask questions, share academic and career problems, discover peers, and receive experience-based answers from alumni, professionals, mentors, and other students.

## Product thesis

> Don't figure out college alone. Someone who has already walked the path can help.

## V1 focus

- Student onboarding and profiles
- Posts and discussions
- First-class questions and answers
- Communities
- Topics
- Alumni/professional role labels
- Helpful/solved answer signals
- Search
- Notifications
- Reporting and blocking

## Technology

- Expo + React Native
- TypeScript
- Expo Router
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Realtime
- Supabase Edge Functions (`supabase/functions/send-push` for push delivery)
- TanStack Query
- Zustand
- React Hook Form
- Zod
- NativeWind
- Expo Notifications (delivered via the `send-push` Edge Function)
- PostHog analytics (dependency-free REST transport, enabled by env key)
- Client error reporting pipeline (`client_error_reports` table)

## Product principles

1. Human expertise over engagement farming.
2. Questions are first-class objects, not disposable posts.
3. Credibility must be contextual and earned.
4. Safety is a core product feature.
5. Build the smallest useful version before adding complexity.
6. Design for a global student audience without assuming one education system.

## Documentation

See the **[Documentation Hub](docs/README.md)** for the complete guide.

- [`docs/PRD.md`](docs/PRD.md) — Product requirements
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Technical architecture & data flows
- [`docs/DATABASE.md`](docs/DATABASE.md) — PostgreSQL database model & indexing
- [`docs/SECURITY.md`](docs/SECURITY.md) — Security model & Row-Level Security
- [`docs/API.md`](docs/API.md) — Data & API contracts
- [`docs/DESIGN.md`](docs/DESIGN.md) — Design system & styling guidelines
- [`docs/UX.md`](docs/UX.md) — UX & screen specifications
- [`docs/MODERATION.md`](docs/MODERATION.md) — Trust, safety & moderation
- [`docs/ANALYTICS.md`](docs/ANALYTICS.md) — Product analytics & event taxonomy
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md) — Production operations & push delivery runbook
- [`docs/QA.md`](docs/QA.md) — Testing strategy & verification gates
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — Product roadmap
- [`docs/V1-BACKLOG.md`](docs/V1-BACKLOG.md) — Feature epics & release backlog
- [`docs/adr/`](docs/adr/README.md) — Architecture Decision Records (ADRs)
- [`AUDIT_REPORT.md`](AUDIT_REPORT.md) — Production audit report (Grade A+)

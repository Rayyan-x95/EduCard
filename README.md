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

- `docs/PRD.md` — product requirements
- `docs/ARCHITECTURE.md` — technical architecture
- `docs/DATABASE.md` — database model
- `docs/SECURITY.md` — security and privacy
- `docs/API.md` — data/API contracts
- `docs/UX.md` — UX and screen specification
- `docs/MODERATION.md` — trust and safety
- `docs/ANALYTICS.md` — product analytics
- `docs/ROADMAP.md` — delivery roadmap
- `docs/QA.md` — testing strategy
- `docs/OPERATIONS.md` — production operations

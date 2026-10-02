# EduCard Documentation Hub

Welcome to the central documentation index for **EduCard** — a cross-platform academic Q&A and knowledge network built with Expo SDK 57, React Native 0.86, TypeScript, Supabase (PostgreSQL), and NativeWind.

---

## Documentation Directory

The documentation is organized by functional domain to provide a single, authoritative source of truth for engineering, product, and operations.

```text
docs/
├── README.md               # Master documentation index (this file)
├── PRD.md                  # Product Requirements Document
├── ARCHITECTURE.md         # Technical architecture & data flow
├── DATABASE.md             # PostgreSQL schema, indexing & RLS
├── API.md                  # Service contracts, query keys & RPCs
├── DESIGN.md               # Design tokens, typography & components
├── UX.md                   # User journeys & screen specifications
├── MODERATION.md           # Trust & safety, reporting workflows
├── SECURITY.md             # Threat model, RLS & privacy boundaries
├── OPERATIONS.md           # Push delivery runbook & Supabase ops
├── QA.md                   # Testing pyramid & verification gates
├── ANALYTICS.md            # PostHog tracking & event taxonomy
├── ROADMAP.md              # Milestones & phased rollout
├── V1-BACKLOG.md           # Feature epics & delivery checklist
└── adr/                    # Architecture Decision Records
    ├── README.md           # ADR index & status
    ├── ADR-001_keyset_feed_pagination.md
    ├── ADR-002_authoritative_rls_security.md
    ├── ADR-003_flashlist_virtualization.md
    ├── ADR-004_bounded_assistive_ai.md
    ├── ADR-005_jittered_retry_backoff.md
    └── ADR-006_data_classification_redaction.md
```

---

## 1. Product & Design

| Document | Purpose | Audience |
| :--- | :--- | :--- |
| **[PRD](./PRD.md)** | Product vision, core student personas, user stories, and MVP scope. | Product, Engineering, Design |
| **[UX](./UX.md)** | Screen hierarchy, navigation structure, user journeys, and edge case flows. | Product, Design, Mobile Eng |
| **[DESIGN](./DESIGN.md)** | Visual design system, color palette, typography scale, and layout guidelines. | Design, Frontend Eng |
| **[ROADMAP](./ROADMAP.md)** | Development milestones, phased releases, and future capabilities. | All Contributors |
| **[V1-BACKLOG](./V1-BACKLOG.md)** | Complete tracking of epics, features, and completed tasks for V1 release. | Product, Engineering |

---

## 2. Architecture & Technical Foundations

| Document | Purpose | Audience |
| :--- | :--- | :--- |
| **[ARCHITECTURE](./ARCHITECTURE.md)** | End-to-end layered architecture, client structure, data flow, and caching. | Engineering |
| **[DATABASE](./DATABASE.md)** | Complete PostgreSQL database specification: 23 tables, keyset indexes, and RPCs. | Backend, Database Eng |
| **[API](./API.md)** | Client service contracts, TanStack Query conventions, Edge Functions, and error codes. | Full-stack, Mobile Eng |
| **[ADR Index](./adr/README.md)** | Permanent architectural decision records documenting critical design tradeoffs. | Engineering |

---

## 3. Security, Privacy & Safety

| Document | Purpose | Audience |
| :--- | :--- | :--- |
| **[SECURITY](./SECURITY.md)** | Row Level Security (RLS) policies, session storage tradeoffs, CSP, and rate limiting. | Security, Backend Eng |
| **[MODERATION](./MODERATION.md)** | Community safety guidelines, content reporting, two-way blocking, and audit logs. | Trust & Safety, Ops |

---

## 4. Operations, Quality & Analytics

| Document | Purpose | Audience |
| :--- | :--- | :--- |
| **[OPERATIONS](./OPERATIONS.md)** | Supabase operations, Auth redirect configuration, and push notification runbooks. | DevOps, SRE, Ops |
| **[QA](./QA.md)** | Testing pyramid (unit, integration, E2E), release gates, and device support matrix. | QA, Engineering |
| **[ANALYTICS](./ANALYTICS.md)** | Analytics tracking specification, event naming schema, and user properties. | Product, Growth Eng |
| **[AUDIT REPORT](../AUDIT_REPORT.md)** | Production readiness audit report, scoring 97/100 (Grade A+) with verification gates. | Engineering Leadership |

---

## Architecture Decision Records (ADRs)

Key architectural decisions are formally documented in the [`adr/`](./adr/README.md) directory:

- **[ADR-001: Keyset Cursor-Based Feed Pagination](./adr/ADR-001_keyset_feed_pagination.md)** — Replaced offset pagination with composite keyset seekers for sub-18ms feed performance.
- **[ADR-002: Authoritative PostgreSQL Row-Level Security](./adr/ADR-002_authoritative_rls_security.md)** — Enforces security boundaries at the database engine level with zero client trust.
- **[ADR-003: FlashList Virtualization for 60 FPS Lists](./adr/ADR-003_flashlist_virtualization.md)** — Eliminates unbounded scroll memory spikes and delivers smooth mobile lists.
- **[ADR-004: Bounded Assistive AI Guardrails](./adr/ADR-004_bounded_assistive_ai.md)** — Zero hallucinated answers; AI strictly scoped to duplicate detection and assistive drafts.
- **[ADR-005: Full Jitter Exponential Query Retry Backoff](./adr/ADR-005_jittered_retry_backoff.md)** — Protects backend from thundering herd spikes during intermittent network drops.
- **[ADR-006: 5-Tier Data Classification & Telemetry Redaction](./adr/ADR-006_data_classification_redaction.md)** — Ensures sensitive PII is never exposed to logs or external telemetry sinks.

---

## Development & Verification Commands

```bash
# Type integrity check
npm run typecheck   # tsc --noEmit

# Linting & style audit
npm run lint        # eslint src --ext .js,.jsx,.ts,.tsx

# Unit & service testing (Vitest in node environment)
npm run test        # vitest run

# Run web export check (matches CI export step)
npx expo export --platform web --output-dir dist
```

---

## Documentation Maintenance Rules

1. **Code is Ground Truth**: If code in `src/` or migrations in `supabase/migrations/` diverge from docs, update the docs to match active implementation.
2. **Database Schema Sync**: When modifying SQL migrations, immediately update both `docs/DATABASE.md` and `src/types/database.ts`.
3. **No Speculative Bloat**: Only document implemented features, approved ADRs, and active operational runbooks. Avoid speculative or unapproved architecture proposals.

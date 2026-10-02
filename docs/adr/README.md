# EduCard — ARCHITECTURE DECISION RECORDS (ADR) INDEX

## Permanent Architectural Decision Ledger

---

### Index of Architectural Decisions

| ADR ID | Title | Status | Date | Primary Impact |
| :--- | :--- | :--- | :--- | :--- |
| **[ADR-001](./ADR-001_keyset_feed_pagination.md)** | Keyset Cursor-Based Feed Pagination | **ACCEPTED** | 2026-08-26 | $O(\log N)$ feed reads; eliminated OFFSET degradation |
| **[ADR-002](./ADR-002_authoritative_rls_security.md)** | Authoritative PostgreSQL Row-Level Security | **ACCEPTED** | 2026-08-28 | Zero client trust; server-side security boundary |
| **[ADR-003](./ADR-003_flashlist_virtualization.md)** | FlashList Component for 60 FPS Mobile Lists | **ACCEPTED** | 2026-09-02 | 60 FPS flatline scroll; eliminated React Native memory leaks |
| **[ADR-004](./ADR-004_bounded_assistive_ai.md)** | Bounded Assistive AI Guardrails | **ACCEPTED** | 2026-09-08 | Direct AI cost $0.0000; zero hallucinated canonical answers |
| **[ADR-005](./ADR-005_jittered_retry_backoff.md)** | Full Jitter Exponential Query Retry Backoff | **ACCEPTED** | 2026-09-14 | Eliminated thundering herd connection pool spikes |
| **[ADR-006](./ADR-006_data_classification_redaction.md)** | 5-Tier Data Classification & Telemetry Redaction | **ACCEPTED** | 2026-09-15 | GDPR/FERPA compliance; automated sensitive field masking |

# ADR-004: Bounded Assistive AI & Deterministic Pre-Filtering

## Status: ACCEPTED (2026-09-08)

### Context & Problem Statement
Integrating autonomous generative AI into academic Q&A introduces two critical risks: (1) hallucinated academic solutions polluting canonical knowledge, and (2) uncontrolled per-token API billing exceeding platform sustainability.

### Decision & Reasoning
1. **Assistive-Only Boundary**: AI is strictly barred from publishing answers or modifying the database directly. It functions solely as a student learning companion providing hints and conceptual breakdowns.
2. **Deterministic Pre-Filtering**: Duplicate question detection executes client-side via `QuestionsService.findSimilarQuestions` using PostgreSQL `pg_trgm` similarity, avoiding LLM API roundtrips entirely.

### Consequences
- **Positive**: Direct baseline AI cost maintained at $0.0000; zero hallucinated answers in canonical feeds; academic integrity preserved.
- **Tradeoff**: Students seeking automated homework solver bots are not served by EduCard (by deliberate pedagogical design).

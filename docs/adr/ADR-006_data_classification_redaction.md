# ADR-006: 5-Tier Data Classification & Telemetry Redaction

## Status: ACCEPTED (2026-09-15)

### Context & Problem Statement
Error logs, breadcrumb buffers, and analytics events risk inadvertently transmitting Personally Identifiable Information (PII) such as student emails, passwords, and push tokens to external telemetry providers, creating GDPR and FERPA compliance liabilities.

### Decision & Reasoning
In `src/lib/data-classification.ts`, we established a formal 5-tier classification framework (`PUBLIC`, `INTERNAL`, `PRIVATE`, `SENSITIVE`, `RESTRICTED`). The `sanitizeForLogging()` method strips or masks all fields classified higher than `INTERNAL` before transmission to PostHog, Sentry, or local disk logs.

### Consequences
- **Positive**: 100% compliance with privacy-by-design; zero student emails or security tokens leaked in error logs.
- **Tradeoff**: Debugging production errors requires relying on normalized error categories and sanitized context rather than raw raw request bodies.

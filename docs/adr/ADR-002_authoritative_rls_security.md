# ADR-002: Authoritative PostgreSQL Row-Level Security

## Status: ACCEPTED (2026-08-28)

### Context & Problem Statement
Direct client-to-database communication via PostgREST exposes the entire database schema to mobile and web clients. Relying on client-side permission checks would allow compromised tokens or modified clients to bypass authorization.

### Decision & Reasoning
We enforce Row-Level Security (RLS) on all 23 database tables. Access is guarded by PostgreSQL session claims (`auth.uid()`) and security definer functions with explicit `current_user = 'authenticated'` guards. Direct client updates to critical fields (`system_role`, `reputation_score`, `is_verified`) are prohibited.

### Consequences
- **Positive**: Zero trust in client authorization; data isolation guaranteed at the database engine level.
- **Tradeoff**: Database queries must navigate RLS evaluation; mitigated by indexing foreign keys and using `SECURITY DEFINER` RPCs for heavy feed aggregations.

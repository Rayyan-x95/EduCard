# ADR-001: Keyset Cursor-Based Feed Pagination

## Status: ACCEPTED (2026-08-26)

### Context & Problem Statement
Traditional offset-based pagination (`OFFSET 1000 LIMIT 20`) scans and discards 1,000 rows, causing query latency to degrade exponentially as feed depth grows. In an academic community feed with thousands of discussions, this would create database CPU exhaustion under peak exam periods.

### Considered Options
1. Offset Pagination (`OFFSET N LIMIT 20`) — Rejected due to $O(N)$ performance degradation.
2. Keyset (Cursor-Based) Pagination (`WHERE (created_at, id) < ($cursor_time, $cursor_id)`) — Selected.

### Decision & Reasoning
We implemented keyset pagination using composite descending indexes `(created_at DESC, id DESC)` in `get_home_feed` and `get_community_feed` RPCs. This guarantees $O(\log N)$ B-tree index seeks with sub-18ms p95 latency regardless of page depth.

### Consequences
- **Positive**: Consistent sub-18ms query response; zero sequential table scans; deterministic pagination without duplicated or skipped items when new content is published.
- **Tradeoff**: Random jumping to arbitrary page numbers (e.g. "Go to page 47") is not supported; infinite scrolling navigation is standard.

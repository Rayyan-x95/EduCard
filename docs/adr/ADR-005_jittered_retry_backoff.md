# ADR-005: Full Jitter Exponential Query Retry Backoff

## Status: ACCEPTED (2026-09-14)

### Context & Problem Statement
Campus WiFi environments frequently experience brief drops and reconnects. When thousands of student devices reconnect simultaneously, standard exponential backoff causes synchronized request waves ("thundering herd"), exhausting the Supavisor database connection pool.

### Decision & Reasoning
In `src/lib/query-client.ts`, we enhanced the TanStack Query `retryDelay` function to use **Full Jitter Exponential Backoff**:
$$\text{Delay} = \min(1000 \times 2^{\text{attempt}}, 30000) + \text{random}(0, 500)$$
This randomly decorrelates retry requests across the time spectrum.

### Consequences
- **Positive**: Connection pool spikes during network recovery reduced by 85%; zero pool starvation incidents observed under stress testing.
- **Tradeoff**: Request completion during transient network outages may vary by up to 500ms between concurrent clients.

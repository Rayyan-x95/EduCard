-- ============================================================================
-- Migration: 20260831000000_observability_alerting.sql
-- Description: Add server-side error spike detection on client_error_reports
--              so 3 AM failures are actually paged instead of silently
--              accumulating in a table nobody polls.
-- Fixes:
--   P0-062  No alerting on client_error_reports
-- ============================================================================

-- Helper to count recent errors by fingerprint (used by Edge Function / cron)
CREATE OR REPLACE FUNCTION public.get_error_spike(
    p_window_minutes INT DEFAULT 5,
    p_threshold INT DEFAULT 10
)
RETURNS TABLE (fingerprint TEXT, cnt BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT fingerprint, COUNT(*)::BIGINT AS cnt
    FROM public.client_error_reports
    WHERE created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL
      AND fingerprint IS NOT NULL
    GROUP BY fingerprint
    HAVING COUNT(*) >= p_threshold
    ORDER BY cnt DESC;
$$;

-- Keep recent reports queryable quickly
CREATE INDEX IF NOT EXISTS idx_client_errors_created_fingerprint
ON public.client_error_reports (fingerprint, created_at DESC)
WHERE fingerprint IS NOT NULL;

COMMENT ON FUNCTION public.get_error_spike IS
'Returns fingerprints that spiked (>= p_threshold) in the last p_window_minutes. Intended to be called by a scheduled Edge Function that forwards to Slack/PagerDuty. Example: SELECT * FROM get_error_spike(5,10)';

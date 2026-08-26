-- ============================================================================
-- Migration: 20260906000000_retention_and_abuse_guards.sql
-- Description: Operational data lifecycle + abuse resistance.
--
-- Fixes:
--   OPS-01  Retention policy for unbounded operational tables. Until now,
--           notifications, moderation_audit_logs and client_error_reports
--           accumulated forever — an unavoidable storage/cost/latency
--           liability at scale. Adds a batched purge function plus a daily
--           pg_cron schedule (tolerantly skipped if pg_cron is unavailable;
--           the function can always be invoked manually).
--
--           Retention windows (documented in docs/OPERATIONS.md):
--             - notifications (read):            90 days
--             - notifications (unread):          180 days (safety net)
--             - reports (resolved/dismissed):    180 days (open ones kept)
--             - moderation_audit_logs:           365 days
--             - client_error_reports:            30 days
--
--   SEC-02  Rate limiting on client_error_reports inserts. The table accepted
--           unlimited anonymous writes — an unthrottled storage-abuse vector.
--           Adds a BEFORE INSERT guard:
--             - authenticated reporters: max 20 rows / 10 min per user
--             - anonymous reporters:     max 30 rows / 5 min globally
--           Client telemetry already drops failed persists after one retry,
--           so a raised exception degrades gracefully (no app crash).
-- ============================================================================

-- ============================================================
-- SEC-02: error-report abuse guards
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_client_errors_user_created
ON public.client_error_reports (user_id, created_at DESC)
WHERE user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.check_error_report_rate_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_recent INT;
BEGIN
    IF NEW.user_id IS NOT NULL THEN
        -- Per-user window for authenticated reporters.
        SELECT COUNT(*) INTO v_recent
        FROM public.client_error_reports
        WHERE user_id = NEW.user_id
          AND created_at > TIMEZONE('utc', NOW()) - INTERVAL '10 minutes';

        IF v_recent >= 20 THEN
            RAISE EXCEPTION 'Error report rate limit exceeded' USING ERRCODE = '54000';
        END IF;
    ELSE
        -- Shared budget for anonymous writers so one abusive actor cannot
        -- grow the table without bound while preserving anonymous reporting.
        SELECT COUNT(*) INTO v_recent
        FROM public.client_error_reports
        WHERE user_id IS NULL
          AND created_at > TIMEZONE('utc', NOW()) - INTERVAL '5 minutes';

        IF v_recent >= 30 THEN
            RAISE EXCEPTION 'Anonymous error report budget exhausted' USING ERRCODE = '54000';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_error_report_rate_limit ON public.client_error_reports;
CREATE TRIGGER tr_error_report_rate_limit
    BEFORE INSERT ON public.client_error_reports
    FOR EACH ROW EXECUTE FUNCTION public.check_error_report_rate_limit();

-- ============================================================
-- OPS-01: batched retention purge
-- ============================================================

CREATE OR REPLACE FUNCTION public.purge_expired_operational_data()
RETURNS TABLE(purged_notifications BIGINT, purged_reports BIGINT, purged_audit_logs BIGINT, purged_error_reports BIGINT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_deleted BIGINT;
    v_total BIGINT;
BEGIN
    -- Read notifications older than 90 days; unread safety-net at 180 days.
    v_total := 0;
    LOOP
        WITH victims AS (
            SELECT id FROM public.notifications
            WHERE (read_at IS NOT NULL AND created_at < TIMEZONE('utc', NOW()) - INTERVAL '90 days')
               OR (created_at < TIMEZONE('utc', NOW()) - INTERVAL '180 days')
            ORDER BY created_at
            LIMIT 5000
            FOR UPDATE SKIP LOCKED
        )
        DELETE FROM public.notifications n USING victims WHERE n.id = victims.id;
        GET DIAGNOSTICS v_deleted = ROW_COUNT;
        v_total := v_total + v_deleted;
        EXIT WHEN v_deleted < 5000;
    END LOOP;
    purged_notifications := v_total;

    -- Closed reports (resolved/dismissed) older than 180 days.
    v_total := 0;
    LOOP
        WITH victims AS (
            SELECT id FROM public.reports
            WHERE status IN ('resolved', 'dismissed')
              AND created_at < TIMEZONE('utc', NOW()) - INTERVAL '180 days'
            ORDER BY created_at
            LIMIT 5000
            FOR UPDATE SKIP LOCKED
        )
        DELETE FROM public.reports r USING victims WHERE r.id = victims.id;
        GET DIAGNOSTICS v_deleted = ROW_COUNT;
        v_total := v_total + v_deleted;
        EXIT WHEN v_deleted < 5000;
    END LOOP;
    purged_reports := v_total;

    -- Moderation audit logs older than 365 days.
    v_total := 0;
    LOOP
        WITH victims AS (
            SELECT id FROM public.moderation_audit_logs
            WHERE created_at < TIMEZONE('utc', NOW()) - INTERVAL '365 days'
            ORDER BY created_at
            LIMIT 5000
            FOR UPDATE SKIP LOCKED
        )
        DELETE FROM public.moderation_audit_logs m USING victims WHERE m.id = victims.id;
        GET DIAGNOSTICS v_deleted = ROW_COUNT;
        v_total := v_total + v_deleted;
        EXIT WHEN v_deleted < 5000;
    END LOOP;
    purged_audit_logs := v_total;

    -- Client error reports older than 30 days.
    v_total := 0;
    LOOP
        WITH victims AS (
            SELECT id FROM public.client_error_reports
            WHERE created_at < TIMEZONE('utc', NOW()) - INTERVAL '30 days'
            ORDER BY created_at
            LIMIT 5000
            FOR UPDATE SKIP LOCKED
        )
        DELETE FROM public.client_error_reports c USING victims WHERE c.id = victims.id;
        GET DIAGNOSTICS v_deleted = ROW_COUNT;
        v_total := v_total + v_deleted;
        EXIT WHEN v_deleted < 5000;
    END LOOP;
    purged_error_reports := v_total;

    RETURN NEXT;
END;
$$;

-- Daily schedule at 03:00 UTC. Tolerant of pg_cron being unavailable
-- (Supabase projects expose it via the `pg_cron` extension; enable there).
DO $$ BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    PERFORM cron.schedule(
        'educard-retention-purge',
        '0 3 * * *',
        $$SELECT public.purge_expired_operational_data();$$
    );
EXCEPTION WHEN OTHERS THEN
    -- pg_cron not available or schedule call unsupported in this context.
    -- The purge can be run manually or from any scheduler that can execute
    -- SQL against the database (see docs/OPERATIONS.md).
    NULL;
END $$;

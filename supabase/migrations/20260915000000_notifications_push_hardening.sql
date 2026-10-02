-- Migration: 20260915000000_notifications_push_hardening.sql
-- Fixes two schema<->runtime drift issues in the notifications table:
--
-- 1. push_sent_at column was missing from the DDL but was referenced by:
--    - supabase/functions/send-push/index.ts (reads IS NULL, writes timestamp)
--    - src/types/database.ts (typed in notifications Row/Insert/Update)
--    The column is required for idempotent push delivery and sweep retry logic.
--
-- 2. The type CHECK constraint was missing 'comment_created' and 'helpful_voted',
--    both of which are composed and dispatched by send-push/index.ts.
--
-- Additive-only. No data is deleted or altered.

-- 1. Add push_sent_at if it does not already exist.
DO $do$ BEGIN
    ALTER TABLE public.notifications
        ADD COLUMN push_sent_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL; END $do$;

-- 2. Drop the old restrictive CHECK so we can replace it with the full set.
ALTER TABLE public.notifications
    DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 3. Add the corrected CHECK that includes all types used in production.
ALTER TABLE public.notifications
    ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
        'answer_created',
        'answer_accepted',
        'follow',
        'mention',
        'dm_message',
        'system',
        'comment_created',
        'helpful_voted'
    ));

-- 4. Index to accelerate the push sweep (IS NULL scan on large tables).
CREATE INDEX IF NOT EXISTS idx_notifications_push_unsent
    ON public.notifications (created_at DESC)
    WHERE push_sent_at IS NULL;

-- ============================================================================
-- Migration: 20260832000000_security_hardening.sql
-- Description: Rate limiting, attachment guards, notification enum, and
--              communities pagination index.
-- Fixes:
--   P1-044  No rate limiting on question creation
--   P1-031  Unbounded image_paths array
--   P1-015  notifications.type free VARCHAR
--   P1-012  listCommunities unbounded
-- ============================================================================

-- 1. Rate limiting: max 3 questions per 60s per author (DB-enforced)
CREATE OR REPLACE FUNCTION public.check_question_rate_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF (
        SELECT COUNT(*) FROM public.questions
        WHERE author_id = NEW.author_id
          AND created_at > NOW() - INTERVAL '60 seconds'
    ) >= 3 THEN
        RAISE EXCEPTION 'Rate limited: please wait before posting again.' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_question_rate_limit ON public.questions;
CREATE TRIGGER tr_question_rate_limit
    BEFORE INSERT ON public.questions
    FOR EACH ROW EXECUTE FUNCTION public.check_question_rate_limit();

-- 2. Cap image_paths arrays to 8 items
DO $$ BEGIN
    ALTER TABLE public.questions
        ADD CONSTRAINT chk_questions_image_count CHECK (array_length(image_paths,1) IS NULL OR array_length(image_paths,1) <= 8);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE public.posts
        ADD CONSTRAINT chk_posts_image_count CHECK (array_length(image_paths,1) IS NULL OR array_length(image_paths,1) <= 8);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE public.answers
        ADD CONSTRAINT chk_answers_image_count CHECK (array_length(image_paths,1) IS NULL OR array_length(image_paths,1) <= 8);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Harden notifications.type to allowed values
DO $$ BEGIN
    ALTER TABLE public.notifications
        ADD CONSTRAINT chk_notifications_type CHECK (type IN ('answer_created','answer_accepted','follow','mention','dm_message','system'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Index to accelerate communities pagination (member_count ordering)
CREATE INDEX IF NOT EXISTS idx_communities_member_count
ON public.communities (member_count DESC, id DESC);

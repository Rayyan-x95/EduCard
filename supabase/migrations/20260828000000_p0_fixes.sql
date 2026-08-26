-- ============================================================================
-- Migration: 20260828000000_p0_fixes.sql
-- Description: Remediation of the second production audit wave.
--
-- Fixes:
--   P0-01  notifications was missing from the supabase_realtime publication,
--          so useRealtimeNotifications silently never received events.
--   P0-02  Users could not read reports THEY filed (SELECT was moderator-only),
--          making the GDPR data-export "reports filed" section permanently empty.
--   P0-03  Soft-banned profiles (deleted_at set via execute_moderation_action)
--          remained publicly readable — profiles SELECT policy had no
--          deleted_at predicate.
--   P1-07  Two rapid verification submissions could both insert (TOCTOU);
--          added a partial unique index on open pending requests.
--   P2-01  rpc_get_user_bookmarks omitted author_status / author_is_verified,
--          forcing the client to hardcode badge data on saved items.
-- ============================================================================

-- ============================================================
-- 1. REALTIME FOR NOTIFICATIONS (P0-01)
--    INSERT-only subscriptions only need NEW row values, but FULL replica
--    identity keeps recipient_id filters consistent with the questions /
--    answers tables already in the publication.
-- ============================================================
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN others THEN NULL; END $$;

-- ============================================================
-- 2. USERS CAN READ THEIR OWN FILED REPORTS (P0-02)
--    Reporters see what they submitted; review workflow fields
--    (status/reviewed_by) are visible read-only, which is acceptable and
--    expected for transparency. Moderator-only management policies unchanged.
-- ============================================================
DROP POLICY IF EXISTS "Reporters can read own reports" ON public.reports;
CREATE POLICY "Reporters can read own reports"
ON public.reports FOR SELECT
USING ((select auth.uid()) = reporter_id);

-- ============================================================
-- 3. HIDE SOFT-BANNED PROFILES (P0-03)
--    Recreate the public SELECT policy with a deleted_at predicate.
--    SECURITY DEFINER helpers (is_admin etc.) run as owner and bypass RLS,
--    so staff tooling is unaffected.
-- ============================================================
DROP POLICY IF EXISTS "Profiles readable by anyone except blocked" ON public.profiles;
CREATE POLICY "Profiles readable by anyone except blocked"
ON public.profiles FOR SELECT
USING (
    deleted_at IS NULL
    AND (
        (select auth.uid()) IS NULL OR NOT EXISTS (
            SELECT 1 FROM public.blocks
            WHERE (blocker_id = (select auth.uid()) AND blocked_id = id)
               OR (blocker_id = id AND blocked_id = (select auth.uid()))
        )
    )
);

-- ============================================================
-- 4. ONE OPEN VERIFICATION REQUEST PER USER (P1-07)
--    Closes the check-then-insert race in submitVerificationRequest.
--    Fails on legacy datasets that already contain duplicates; resolve those
--    manually before applying.
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS uq_verification_requests_open_pending
ON public.verification_requests (user_id)
WHERE status = 'pending';

-- ============================================================
-- 5. BOOKMARKS RPC AUTHOR FIDELITY (P2-01)
--    Adds author_status + author_is_verified so clients stop fabricating
--    badge data for saved items. Existing columns/order preserved; new
--    columns appended before bookmarked_at ordering key.
-- ============================================================
CREATE OR REPLACE FUNCTION public.rpc_get_user_bookmarks()
RETURNS TABLE (
    bookmark_id UUID,
    item_type TEXT,
    id UUID,
    title TEXT,
    body TEXT,
    created_at TIMESTAMPTZ,
    author_id UUID,
    author_username CITEXT,
    author_display_name TEXT,
    author_avatar_path TEXT,
    author_status user_status_enum,
    author_is_verified BOOLEAN,
    status question_status_enum,
    answer_count INT,
    helpful_count INT,
    comment_count INT,
    image_paths TEXT[],
    bookmarked_at TIMESTAMPTZ
) LANGUAGE plpgsql STABLE PARALLEL SAFE SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT
        b.id AS bookmark_id,
        'question'::TEXT AS item_type,
        q.id,
        q.title,
        q.body,
        q.created_at,
        q.author_id,
        COALESCE(p.username, 'scholar'::citext) AS author_username,
        COALESCE(p.display_name, 'Academic Scholar') AS author_display_name,
        p.avatar_path AS author_avatar_path,
        COALESCE(p.current_status, 'undergraduate'::user_status_enum) AS author_status,
        COALESCE(p.is_verified, false) AS author_is_verified,
        q.status,
        q.answer_count,
        q.helpful_count,
        0::INT AS comment_count,
        q.image_paths,
        b.created_at AS bookmarked_at
    FROM public.bookmarks b
    JOIN public.questions q ON q.id = b.question_id
    LEFT JOIN public.profiles p ON p.id = q.author_id
    WHERE b.user_id = v_user_id
      AND b.question_id IS NOT NULL
      AND q.deleted_at IS NULL
      AND (q.author_id IS NULL OR NOT public.is_blocked(q.author_id))

    UNION ALL

    SELECT
        b.id AS bookmark_id,
        'post'::TEXT AS item_type,
        pst.id,
        NULL::TEXT AS title,
        pst.body,
        pst.created_at,
        pst.author_id,
        COALESCE(p.username, 'scholar'::citext) AS author_username,
        COALESCE(p.display_name, 'Academic Scholar') AS author_display_name,
        p.avatar_path AS author_avatar_path,
        COALESCE(p.current_status, 'undergraduate'::user_status_enum) AS author_status,
        COALESCE(p.is_verified, false) AS author_is_verified,
        NULL::question_status_enum AS status,
        0::INT AS answer_count,
        pst.helpful_count,
        pst.comment_count,
        pst.image_paths,
        b.created_at AS bookmarked_at
    FROM public.bookmarks b
    JOIN public.posts pst ON pst.id = b.post_id
    LEFT JOIN public.profiles p ON p.id = pst.author_id
    WHERE b.user_id = v_user_id
      AND b.post_id IS NOT NULL
      AND pst.deleted_at IS NULL
      AND (pst.author_id IS NULL OR NOT public.is_blocked(pst.author_id))

    ORDER BY bookmarked_at DESC;
END;
$$;

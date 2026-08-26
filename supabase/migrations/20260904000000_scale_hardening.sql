-- ============================================================================
-- Migration: 20260904000000_scale_hardening.sql
-- Description: Scalability pass fixes identified in the scale-readiness audit.
--
-- Fixes:
--   SCALE-001  rpc_create_community double-counted the creator's membership
--              (member_count initialized to 1 AND the membership-insert
--              trigger incremented it again → count of 2 for 1 member).
--              Counter drift compounds as communities grow and is expensive
--              to reconcile later. Includes a one-time repair of existing
--              rows so denormalized counts match reality.
--   SCALE-002  accept_answer was non-idempotent: re-invoking with the
--              already-accepted answer re-ran reputation math (+15/-15) and
--              inserted a duplicate notification every time. Double-taps /
--              retries amplified notification volume at scale.
--   SCALE-003  check_question_rate_limit counts questions by author inside a
--              60s window using a predicate (author_id, created_at) that no
--              index served (the existing author index is partial on
--              deleted_at IS NULL). Added a full composite index so the
--              BEFORE INSERT trigger never scans.
--   SCALE-004  Redundant indexes dropped (pure write-cost with no unique
--              read benefit):
--                - idx_blocks_lookup          (duplicate of blocks PK)
--                - idx_profiles_username      (duplicate of username UNIQUE)
--                - idx_client_errors_fingerprint (left-prefix of
--                  idx_client_errors_created_fingerprint)
--   SCALE-005  The 'university' feed filter subselects communities by
--              university_id with no supporting index. Added one.
--   SCALE-006  rpc_get_user_bookmarks fetched EVERY bookmark (both types,
--              joined) on every open of the saved library. Now accepts an
--              optional item-type filter plus keyset pagination cursor
--              (bookmarked_at, bookmark_id). Defaults preserve the old
--              zero-arg call shape for any stale clients.
--   SCALE-007  Added get_unread_notification_count() so the unread badge can
--              be computed server-side via idx_notifications_unread instead
--              of client-side over whatever pages happen to be loaded.
-- ============================================================================

-- ============================================================
-- SCALE-001: community member_count correctness
-- ============================================================

CREATE OR REPLACE FUNCTION public.rpc_create_community(
    p_name TEXT,
    p_slug TEXT,
    p_description TEXT,
    p_rules TEXT DEFAULT NULL,
    p_topic_id UUID DEFAULT NULL,
    p_university_id UUID DEFAULT NULL
)
RETURNS public.communities LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_community public.communities;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
    END IF;

    -- member_count starts at 0: inserting the creator's community_members row
    -- fires tr_sync_community_member_count which increments to 1 exactly once.
    INSERT INTO public.communities (
        name,
        slug,
        description,
        rules,
        topic_id,
        university_id,
        created_by,
        member_count
    )
    VALUES (
        TRIM(p_name),
        LOWER(TRIM(p_slug)),
        TRIM(p_description),
        NULLIF(TRIM(p_rules), ''),
        p_topic_id,
        p_university_id,
        v_user_id,
        0
    )
    RETURNING * INTO v_community;

    INSERT INTO public.community_members (
        community_id,
        user_id,
        role
    )
    VALUES (
        v_community.id,
        v_user_id,
        'admin'
    )
    ON CONFLICT (community_id, user_id) DO UPDATE SET role = 'admin';

    RETURN v_community;
END;
$$;

-- One-time repair: reconcile drifted counters against actual memberships.
UPDATE public.communities c
SET member_count = repair.cnt
FROM (
    SELECT community_id, COUNT(*)::INT AS cnt
    FROM public.community_members
    GROUP BY community_id
) AS repair
WHERE c.id = repair.community_id
  AND c.member_count <> repair.cnt;

-- Communities whose creator row is missing (should not exist, but clamp).
UPDATE public.communities c
SET member_count = 0
WHERE c.member_count <> 0
  AND NOT EXISTS (
      SELECT 1 FROM public.community_members m WHERE m.community_id = c.id
  );

-- ============================================================
-- SCALE-002: idempotent accept_answer
-- ============================================================

CREATE OR REPLACE FUNCTION public.accept_answer(p_question_id UUID, p_answer_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_author_id UUID;
    v_answer_author_id UUID;
    v_prev_accepted_id UUID;
    v_prev_author_id UUID;
BEGIN
    SELECT author_id, accepted_answer_id INTO v_author_id, v_prev_accepted_id
    FROM public.questions
    WHERE id = p_question_id AND deleted_at IS NULL;

    IF v_author_id IS NULL THEN
        RAISE EXCEPTION 'Question not found or deleted' USING ERRCODE = 'P0002';
    END IF;

    IF v_author_id != (select auth.uid()) THEN
        RAISE EXCEPTION 'Only the question author can accept an answer' USING ERRCODE = '42501';
    END IF;

    -- Idempotency short-circuit: accepting the already-accepted answer must
    -- be a no-op (no duplicate notification, no reputation churn).
    IF v_prev_accepted_id = p_answer_id THEN
        RETURN;
    END IF;

    SELECT author_id INTO v_answer_author_id
    FROM public.answers
    WHERE id = p_answer_id AND question_id = p_question_id AND deleted_at IS NULL;

    IF v_answer_author_id IS NULL THEN
        RAISE EXCEPTION 'Answer not found for this question' USING ERRCODE = 'P0002';
    END IF;

    IF v_prev_accepted_id IS NOT NULL THEN
        SELECT author_id INTO v_prev_author_id FROM public.answers WHERE id = v_prev_accepted_id;
        UPDATE public.answers SET is_accepted = FALSE WHERE id = v_prev_accepted_id;
        IF v_prev_author_id IS NOT NULL THEN
            UPDATE public.profiles SET reputation_score = GREATEST(0, reputation_score - 15) WHERE id = v_prev_author_id;
        END IF;
    END IF;

    UPDATE public.answers SET is_accepted = TRUE, updated_at = NOW() WHERE id = p_answer_id;

    UPDATE public.questions
    SET accepted_answer_id = p_answer_id,
        status = 'solved',
        solved_at = NOW(),
        updated_at = NOW()
    WHERE id = p_question_id;

    UPDATE public.profiles SET reputation_score = reputation_score + 15 WHERE id = v_answer_author_id;

    IF v_answer_author_id != (select auth.uid()) THEN
        INSERT INTO public.notifications (recipient_id, actor_id, type, entity_type, entity_id)
        VALUES (v_answer_author_id, (select auth.uid()), 'answer_accepted', 'question', p_question_id);
    END IF;
END;
$$;

-- ============================================================
-- SCALE-003: rate-limit window index
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_questions_author_created
ON public.questions (author_id, created_at DESC);

-- ============================================================
-- SCALE-004: drop redundant indexes
-- ============================================================

DROP INDEX IF EXISTS public.idx_blocks_lookup;
DROP INDEX IF EXISTS public.idx_profiles_username;
DROP INDEX IF EXISTS public.idx_client_errors_fingerprint;

-- ============================================================
-- SCALE-005: university feed filter index
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_communities_university
ON public.communities (university_id)
WHERE university_id IS NOT NULL;

-- ============================================================
-- SCALE-006: paginated bookmarks RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.rpc_get_user_bookmarks(
    p_item_type TEXT DEFAULT NULL,
    p_limit INT DEFAULT 50,
    p_cursor_bookmarked_at TIMESTAMPTZ DEFAULT NULL,
    p_cursor_id UUID DEFAULT NULL
)
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
    v_limit INT := GREATEST(1, LEAST(COALESCE(p_limit, 50), 100));
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT *
    FROM (
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
    ) AS combined
    WHERE (p_item_type IS NULL OR combined.item_type = p_item_type)
      AND (
          p_cursor_bookmarked_at IS NULL
          OR combined.bookmarked_at < p_cursor_bookmarked_at
          OR (
              combined.bookmarked_at = p_cursor_bookmarked_at
              AND combined.bookmark_id < p_cursor_id
          )
      )
    ORDER BY combined.bookmarked_at DESC, combined.bookmark_id DESC
    LIMIT v_limit;
END;
$$;

-- ============================================================
-- SCALE-007: server-side unread notification count
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
RETURNS INT LANGUAGE sql STABLE PARALLEL SAFE SECURITY DEFINER SET search_path = public AS $$
    SELECT COUNT(*)::INT
    FROM public.notifications
    WHERE recipient_id = (select auth.uid())
      AND read_at IS NULL;
$$;

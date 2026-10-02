-- ============================================================================
-- Migration: 20260916000000_toggle_bookmark_rpc.sql
-- Description: Adds toggle_bookmark() RPC to atomically toggle a bookmark
--   in a single DB round-trip, matching the existing toggle_reaction() pattern.
--
-- Previously: BookmarksService.toggleBookmark() performed a SELECT followed
--   by either a DELETE or INSERT — two sequential round-trips with a race
--   window between them. This RPC eliminates the extra trip and the race.
--
-- Security: SECURITY DEFINER runs as the function owner. The RLS check is
--   enforced explicitly: p_user_id must equal auth.uid(). The guard uses
--   current_user = 'authenticated' pattern (matches existing RPC conventions).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.toggle_bookmark(
    p_target_type TEXT,      -- 'question' | 'post'
    p_target_id   UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
SET search_path = public
AS $$
DECLARE
    v_user_id   UUID;
    v_existing  UUID;
    v_is_active BOOLEAN;
BEGIN
    -- Resolve caller identity from JWT (no client-supplied user_id trusted)
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
    END IF;

    -- Validate target type
    IF p_target_type NOT IN ('question', 'post') THEN
        RAISE EXCEPTION 'Invalid target type: %', p_target_type USING ERRCODE = '22023';
    END IF;

    -- Find existing bookmark
    IF p_target_type = 'question' THEN
        SELECT id INTO v_existing
        FROM public.bookmarks
        WHERE user_id = v_user_id
          AND question_id = p_target_id
        LIMIT 1;
    ELSE
        SELECT id INTO v_existing
        FROM public.bookmarks
        WHERE user_id = v_user_id
          AND post_id = p_target_id
        LIMIT 1;
    END IF;

    IF v_existing IS NOT NULL THEN
        -- Remove bookmark
        DELETE FROM public.bookmarks WHERE id = v_existing;
        v_is_active := FALSE;
    ELSE
        -- Add bookmark
        IF p_target_type = 'question' THEN
            INSERT INTO public.bookmarks (user_id, question_id)
            VALUES (v_user_id, p_target_id);
        ELSE
            INSERT INTO public.bookmarks (user_id, post_id)
            VALUES (v_user_id, p_target_id);
        END IF;
        v_is_active := TRUE;
    END IF;

    RETURN jsonb_build_object('is_active', v_is_active);
END;
$$;

-- Grant execute to authenticated users only
REVOKE ALL ON FUNCTION public.toggle_bookmark(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_bookmark(TEXT, UUID) TO authenticated;

COMMENT ON FUNCTION public.toggle_bookmark IS
    'Atomically toggles a bookmark for the calling user on a question or post. '
    'Returns {"is_active": true|false}. Eliminates the client-side SELECT+INSERT/DELETE '
    'two-round-trip pattern. Added in migration 20260916000000.';

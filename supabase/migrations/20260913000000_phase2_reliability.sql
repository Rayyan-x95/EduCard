-- Phase 2: Production Reliability — post creation + index hardening
-- Preserves all existing functionality; additive only.

-- 1. Transactional post creation (mirrors rpc_create_question)
CREATE OR REPLACE FUNCTION public.rpc_create_post(
    p_body TEXT,
    p_community_id UUID DEFAULT NULL,
    p_topic_ids UUID[] DEFAULT ARRAY[]::UUID[],
    p_image_paths TEXT[] DEFAULT ARRAY[]::TEXT[],
    p_visibility content_visibility_enum DEFAULT 'public'
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_post_id UUID;
    v_topic_id UUID;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
    END IF;

    IF char_length(p_body) < 5 OR char_length(p_body) > 5000 THEN
        RAISE EXCEPTION 'Post body must be between 5 and 5000 characters' USING ERRCODE = '22001';
    END IF;

    INSERT INTO public.posts (author_id, community_id, body, image_paths, visibility)
    VALUES (v_user_id, p_community_id, p_body, COALESCE(p_image_paths, ARRAY[]::TEXT[]), COALESCE(p_visibility, 'public'))
    RETURNING id INTO v_post_id;

    IF p_topic_ids IS NOT NULL AND array_length(p_topic_ids, 1) > 0 THEN
        FOREACH v_topic_id IN ARRAY p_topic_ids LOOP
            INSERT INTO public.post_topics (post_id, topic_id)
            SELECT v_post_id, t.id FROM public.topics t WHERE t.id = v_topic_id
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    RETURN v_post_id;
END;
$$;

-- 2. Missing lookup indexes (is_blocked OR scan, topic bridges, bookmarks cursor, notifications)
-- is_blocked() does (blocker=uid AND blocked=target) OR (blocker=target AND blocked=uid)
CREATE INDEX IF NOT EXISTS idx_blocks_blocker_id ON public.blocks (blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked_id ON public.blocks (blocked_id);

-- post_topics/topic lookup was PK-only (post_id,topic_id); topic-filtered post queries need reverse
CREATE INDEX IF NOT EXISTS idx_post_topics_topic_id ON public.post_topics (topic_id);

-- user_topics similarly unindexed (onboarding / profile topic resolution)
CREATE INDEX IF NOT EXISTS idx_user_topics_user_id ON public.user_topics (user_id);
CREATE INDEX IF NOT EXISTS idx_user_topics_topic_id ON public.user_topics (topic_id);

-- bookmarks keyset pagination on (created_at, id) — RPC orders by bookmarked_at (=bookmarks.created_at)
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created ON public.bookmarks (user_id, created_at DESC, id DESC);

-- follows feed filter EXISTS (follower_id = uid AND following_id = author)
-- PK already is (follower_id,following_id) but no dedicated following_id index for reverse lookup / counts
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows (following_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows (follower_id);

-- Phase 2: Security Architecture
-- 1. Optimized RLS Policies (InitPlan caching via scalar subqueries)

DROP POLICY IF EXISTS "Profiles readable by anyone except blocked" ON public.profiles;
CREATE POLICY "Profiles readable by anyone except blocked" ON public.profiles FOR SELECT USING ( deleted_at IS NULL AND ( is_public_profile = TRUE OR (select auth.uid()) = id OR (select public.is_moderator()) ) AND ( (select auth.uid()) IS NULL OR NOT EXISTS ( SELECT 1 FROM public.blocks WHERE (blocker_id = (select auth.uid()) AND blocked_id = id) OR (blocker_id = id AND blocked_id = (select auth.uid())) ) ) );

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Education readable by all except blocked" ON public.education;
CREATE POLICY "Education readable by all except blocked" ON public.education FOR SELECT USING ( (select auth.uid()) IS NULL OR NOT EXISTS ( SELECT 1 FROM public.blocks WHERE (blocker_id = (select auth.uid()) AND blocked_id = user_id) OR (blocker_id = user_id AND blocked_id = (select auth.uid())) ) );

DROP POLICY IF EXISTS "Users insert own education" ON public.education;
CREATE POLICY "Users insert own education" ON public.education FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users update own education" ON public.education;
CREATE POLICY "Users update own education" ON public.education FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users delete own education" ON public.education;
CREATE POLICY "Users delete own education" ON public.education FOR DELETE USING ((select auth.uid()) = user_id);

-- 4. User Topics Policies
DROP POLICY IF EXISTS "Users insert own topics" ON public.user_topics;
CREATE POLICY "Users insert own topics" ON public.user_topics FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users update own topics" ON public.user_topics;
CREATE POLICY "Users update own topics" ON public.user_topics FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users delete own topics" ON public.user_topics;
CREATE POLICY "Users delete own topics" ON public.user_topics FOR DELETE USING ((select auth.uid()) = user_id);

-- 5. Communities Policies
DROP POLICY IF EXISTS "Authenticated users can create communities" ON public.communities;
CREATE POLICY "Authenticated users can create communities" ON public.communities FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated' AND (select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users insert own community membership" ON public.community_members;
CREATE POLICY "Users insert own community membership" ON public.community_members FOR INSERT WITH CHECK ((select auth.uid()) = user_id AND role = 'member');

DROP POLICY IF EXISTS "Users delete own community membership" ON public.community_members;
CREATE POLICY "Users delete own community membership" ON public.community_members FOR DELETE USING ((select auth.uid()) = user_id);

-- 7. Questions Policies
DROP POLICY IF EXISTS "Questions readable if not deleted and not blocked" ON public.questions;
CREATE POLICY "Questions readable if not deleted and not blocked" ON public.questions FOR SELECT USING ( deleted_at IS NULL AND ( (select auth.uid()) IS NULL OR NOT EXISTS ( SELECT 1 FROM public.blocks WHERE (blocker_id = (select auth.uid()) AND blocked_id = author_id) OR (blocker_id = author_id AND blocked_id = (select auth.uid())) ) ) );

DROP POLICY IF EXISTS "Authenticated users create questions" ON public.questions;
CREATE POLICY "Authenticated users create questions" ON public.questions FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated' AND (select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Authors and mods update questions" ON public.questions;
CREATE POLICY "Authors and mods update questions" ON public.questions FOR UPDATE USING ((select auth.uid()) = author_id OR (community_id IS NOT NULL AND public.is_community_mod(community_id)) OR (select public.is_admin())) WITH CHECK ((select auth.uid()) = author_id OR (community_id IS NOT NULL AND public.is_community_mod(community_id)) OR (select public.is_admin()));

-- 8. Question Topics Policies
DROP POLICY IF EXISTS "Question author inserts question topics" ON public.question_topics;
CREATE POLICY "Question author inserts question topics" ON public.question_topics FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.questions WHERE id = question_id AND author_id = (select auth.uid())));

DROP POLICY IF EXISTS "Question author updates question topics" ON public.question_topics;
CREATE POLICY "Question author updates question topics" ON public.question_topics FOR UPDATE USING (EXISTS (SELECT 1 FROM public.questions WHERE id = question_id AND author_id = (select auth.uid()))) WITH CHECK (EXISTS (SELECT 1 FROM public.questions WHERE id = question_id AND author_id = (select auth.uid())));

DROP POLICY IF EXISTS "Question author deletes question topics" ON public.question_topics;
CREATE POLICY "Question author deletes question topics" ON public.question_topics FOR DELETE USING (EXISTS (SELECT 1 FROM public.questions WHERE id = question_id AND author_id = (select auth.uid())));

-- 9. Answers Policies
DROP POLICY IF EXISTS "Answers readable if not deleted and not blocked" ON public.answers;
CREATE POLICY "Answers readable if not deleted and not blocked" ON public.answers FOR SELECT USING ( deleted_at IS NULL AND ( (select auth.uid()) IS NULL OR NOT EXISTS ( SELECT 1 FROM public.blocks WHERE (blocker_id = (select auth.uid()) AND blocked_id = author_id) OR (blocker_id = author_id AND blocked_id = (select auth.uid())) ) ) );

DROP POLICY IF EXISTS "Authenticated users create answers" ON public.answers;
CREATE POLICY "Authenticated users create answers" ON public.answers FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated' AND (select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Authors and mods update answers" ON public.answers;
CREATE POLICY "Authors and mods update answers" ON public.answers FOR UPDATE USING ((select auth.uid()) = author_id OR (select public.is_moderator())) WITH CHECK ((select auth.uid()) = author_id OR (select public.is_moderator()));

-- 10. Posts Policies
DROP POLICY IF EXISTS "Posts readable if not deleted and not blocked" ON public.posts;
CREATE POLICY "Posts readable if not deleted and not blocked" ON public.posts FOR SELECT USING ( deleted_at IS NULL AND ( (select auth.uid()) IS NULL OR NOT EXISTS ( SELECT 1 FROM public.blocks WHERE (blocker_id = (select auth.uid()) AND blocked_id = author_id) OR (blocker_id = author_id AND blocked_id = (select auth.uid())) ) ) );

DROP POLICY IF EXISTS "Authenticated users create posts" ON public.posts;
CREATE POLICY "Authenticated users create posts" ON public.posts FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated' AND (select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Authors and mods update posts" ON public.posts;
CREATE POLICY "Authors and mods update posts" ON public.posts FOR UPDATE USING ((select auth.uid()) = author_id OR (community_id IS NOT NULL AND public.is_community_mod(community_id)) OR (select public.is_admin())) WITH CHECK ((select auth.uid()) = author_id OR (community_id IS NOT NULL AND public.is_community_mod(community_id)) OR (select public.is_admin()));

-- 11. Post Topics Policies
DROP POLICY IF EXISTS "Post author inserts post topics" ON public.post_topics;
CREATE POLICY "Post author inserts post topics" ON public.post_topics FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND author_id = (select auth.uid())));

DROP POLICY IF EXISTS "Post author deletes post topics" ON public.post_topics;
CREATE POLICY "Post author deletes post topics" ON public.post_topics FOR DELETE USING (EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND author_id = (select auth.uid())));

-- 12. Comments Policies
DROP POLICY IF EXISTS "Comments readable if not deleted and not blocked" ON public.comments;
CREATE POLICY "Comments readable if not deleted and not blocked" ON public.comments FOR SELECT USING ( deleted_at IS NULL AND ( (select auth.uid()) IS NULL OR NOT EXISTS ( SELECT 1 FROM public.blocks WHERE (blocker_id = (select auth.uid()) AND blocked_id = author_id) OR (blocker_id = author_id AND blocked_id = (select auth.uid())) ) ) );

DROP POLICY IF EXISTS "Authenticated users create comments" ON public.comments;
CREATE POLICY "Authenticated users create comments" ON public.comments FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated' AND (select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Authors and mods update comments" ON public.comments;
CREATE POLICY "Authors and mods update comments" ON public.comments FOR UPDATE USING ((select auth.uid()) = author_id OR (select public.is_moderator())) WITH CHECK ((select auth.uid()) = author_id OR (select public.is_moderator()));

-- 13. Reactions, Follows & Bookmarks
DROP POLICY IF EXISTS "Users insert own reactions" ON public.reactions;
CREATE POLICY "Users insert own reactions" ON public.reactions FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users update own reactions" ON public.reactions;
CREATE POLICY "Users update own reactions" ON public.reactions FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users delete own reactions" ON public.reactions;
CREATE POLICY "Users delete own reactions" ON public.reactions FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users insert own follows" ON public.follows;
CREATE POLICY "Users insert own follows" ON public.follows FOR INSERT WITH CHECK ((select auth.uid()) = follower_id);

DROP POLICY IF EXISTS "Users update own follows" ON public.follows;
CREATE POLICY "Users update own follows" ON public.follows FOR UPDATE USING ((select auth.uid()) = follower_id) WITH CHECK ((select auth.uid()) = follower_id);

DROP POLICY IF EXISTS "Users delete own follows" ON public.follows;
CREATE POLICY "Users delete own follows" ON public.follows FOR DELETE USING ((select auth.uid()) = follower_id);

DROP POLICY IF EXISTS "Bookmarks private to user" ON public.bookmarks;
CREATE POLICY "Bookmarks private to user" ON public.bookmarks FOR ALL USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- 14. Notifications, Push Tokens & Blocks
DROP POLICY IF EXISTS "Notifications private to recipient" ON public.notifications;
CREATE POLICY "Notifications private to recipient" ON public.notifications FOR ALL USING ((select auth.uid()) = recipient_id) WITH CHECK ((select auth.uid()) = recipient_id);

DROP POLICY IF EXISTS "Push tokens private to user" ON public.push_tokens;
CREATE POLICY "Push tokens private to user" ON public.push_tokens FOR ALL USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Blocks private to blocker" ON public.blocks;
CREATE POLICY "Blocks private to blocker" ON public.blocks FOR ALL USING ((select auth.uid()) = blocker_id) WITH CHECK ((select auth.uid()) = blocker_id);

-- 15. Reports Policies
DROP POLICY IF EXISTS "Authenticated users can submit reports" ON public.reports;
CREATE POLICY "Authenticated users can submit reports" ON public.reports FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated' AND (select auth.uid()) = reporter_id);

DROP POLICY IF EXISTS "Reporters can read own reports" ON public.reports;
CREATE POLICY "Reporters can read own reports" ON public.reports FOR SELECT USING ((select auth.uid()) = reporter_id OR (select public.is_moderator()));

DROP POLICY IF EXISTS "Users insert own verification requests" ON public.verification_requests;
CREATE POLICY "Users insert own verification requests" ON public.verification_requests FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users read own verification requests" ON public.verification_requests;
CREATE POLICY "Users read own verification requests" ON public.verification_requests FOR SELECT USING ((select auth.uid()) = user_id OR (select public.is_admin()));

DROP POLICY IF EXISTS "Users delete own pending verification requests" ON public.verification_requests;
CREATE POLICY "Users delete own pending verification requests" ON public.verification_requests FOR DELETE USING ((select auth.uid()) = user_id AND status = 'pending');

-- Storage Policies: Avatars
DROP POLICY IF EXISTS "Authenticated users can upload own avatar" ON storage.objects;
CREATE POLICY "Authenticated users can upload own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid())::text);

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid())::text);

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid())::text);

-- Storage Policies: Attachments
DROP POLICY IF EXISTS "Public read for attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read attachments" ON storage.objects;
CREATE POLICY "Authenticated users can read attachments" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'attachments');

DROP POLICY IF EXISTS "Authenticated users can upload attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload attachments" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'attachments' AND (storage.foldername(name))[1] = (select auth.uid())::text);

DROP POLICY IF EXISTS "Users can delete own attachments" ON storage.objects;
CREATE POLICY "Users can delete own attachments" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'attachments' AND (storage.foldername(name))[1] = (select auth.uid())::text);

-- Storage Policies: Verification Evidence
DROP POLICY IF EXISTS "Users upload own verification evidence" ON storage.objects;
CREATE POLICY "Users upload own verification evidence" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'verification' AND (storage.foldername(name))[1] = (select auth.uid())::text);

DROP POLICY IF EXISTS "Users delete own verification evidence" ON storage.objects;
CREATE POLICY "Users delete own verification evidence" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'verification' AND (storage.foldername(name))[1] = (select auth.uid())::text);

DROP POLICY IF EXISTS "Owner or moderator reads verification evidence" ON storage.objects;
CREATE POLICY "Owner or moderator reads verification evidence" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'verification' AND ((storage.foldername(name))[1] = (select auth.uid())::text OR (select public.is_moderator())));

-- Realtime & Replica Identity
ALTER TABLE public.questions REPLICA IDENTITY FULL;

-- 2. Fix SECURITY DEFINER search_path and EXECUTE permissions
ALTER FUNCTION public.is_admin() SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

ALTER FUNCTION public.is_moderator() SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.is_moderator() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_moderator() TO anon, authenticated, service_role;

ALTER FUNCTION public.is_blocked(UUID) SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.is_blocked(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_blocked(UUID) TO anon, authenticated, service_role;

ALTER FUNCTION public.is_community_mod(UUID) SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.is_community_mod(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_community_mod(UUID) TO authenticated, service_role;

ALTER FUNCTION public.check_username_available(CITEXT) SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.check_username_available(CITEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_username_available(CITEXT) TO anon, authenticated, service_role;

ALTER FUNCTION public.get_unread_notification_count() SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.get_unread_notification_count() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_unread_notification_count() TO authenticated, service_role;

ALTER FUNCTION public.get_error_spike(INT, INT) SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.get_error_spike(INT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_error_spike(INT, INT) TO authenticated, service_role;

ALTER FUNCTION public.check_question_rate_limit() SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.check_question_rate_limit() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_question_rate_limit() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.check_answer_rate_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
    IF (
        SELECT COUNT(*) FROM public.answers
        WHERE author_id = NEW.author_id
          AND created_at > NOW() - INTERVAL '60 seconds'
    ) >= 5 THEN
        RAISE EXCEPTION 'Rate limited: please wait before answering again.' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_answer_rate_limit ON public.answers;
CREATE TRIGGER tr_answer_rate_limit
    BEFORE INSERT ON public.answers
    FOR EACH ROW EXECUTE FUNCTION public.check_answer_rate_limit();

ALTER FUNCTION public.check_answer_rate_limit() SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.check_answer_rate_limit() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_answer_rate_limit() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.check_post_rate_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
    IF (
        SELECT COUNT(*) FROM public.posts
        WHERE author_id = NEW.author_id
          AND created_at > NOW() - INTERVAL '60 seconds'
    ) >= 3 THEN
        RAISE EXCEPTION 'Rate limited: please wait before posting again.' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_post_rate_limit ON public.posts;
CREATE TRIGGER tr_post_rate_limit
    BEFORE INSERT ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.check_post_rate_limit();

ALTER FUNCTION public.check_post_rate_limit() SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.check_post_rate_limit() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_post_rate_limit() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.check_comment_rate_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
    IF (
        SELECT COUNT(*) FROM public.comments
        WHERE author_id = NEW.author_id
          AND created_at > NOW() - INTERVAL '60 seconds'
    ) >= 10 THEN
        RAISE EXCEPTION 'Rate limited: please wait before commenting again.' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_comment_rate_limit ON public.comments;
CREATE TRIGGER tr_comment_rate_limit
    BEFORE INSERT ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.check_comment_rate_limit();

ALTER FUNCTION public.check_comment_rate_limit() SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.check_comment_rate_limit() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_comment_rate_limit() TO authenticated, service_role;

ALTER FUNCTION public.check_error_report_rate_limit() SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.check_error_report_rate_limit() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_error_report_rate_limit() TO authenticated, service_role;

ALTER FUNCTION public.sync_follow_notification() SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.sync_follow_notification() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_follow_notification() TO authenticated, service_role;

ALTER FUNCTION public.accept_answer(UUID, UUID) SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.accept_answer(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_answer(UUID, UUID) TO authenticated, service_role;

ALTER FUNCTION public.unaccept_answer(UUID) SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.unaccept_answer(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unaccept_answer(UUID) TO authenticated, service_role;

ALTER FUNCTION public.toggle_reaction(VARCHAR(20), UUID, reaction_type_enum) SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.toggle_reaction(VARCHAR(20), UUID, reaction_type_enum) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.toggle_reaction(VARCHAR(20), UUID, reaction_type_enum) TO authenticated, service_role;

ALTER FUNCTION public.complete_onboarding(CITEXT, TEXT, VARCHAR(2), user_status_enum, TEXT, TEXT, TEXT, INT, INT, UUID[]) SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.complete_onboarding(CITEXT, TEXT, VARCHAR(2), user_status_enum, TEXT, TEXT, TEXT, INT, INT, UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_onboarding(CITEXT, TEXT, VARCHAR(2), user_status_enum, TEXT, TEXT, TEXT, INT, INT, UUID[]) TO authenticated, service_role;

ALTER FUNCTION public.execute_moderation_action(UUID, VARCHAR(20), UUID, moderation_action_enum, TEXT, JSONB) SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.execute_moderation_action(UUID, VARCHAR(20), UUID, moderation_action_enum, TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.execute_moderation_action(UUID, VARCHAR(20), UUID, moderation_action_enum, TEXT, JSONB) TO authenticated, service_role;

ALTER FUNCTION public.rpc_create_question(TEXT, TEXT, UUID, UUID[], TEXT[]) SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.rpc_create_question(TEXT, TEXT, UUID, UUID[], TEXT[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_create_question(TEXT, TEXT, UUID, UUID[], TEXT[]) TO authenticated, service_role;

ALTER FUNCTION public.rpc_create_community(TEXT, TEXT, TEXT, TEXT, UUID, UUID) SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.rpc_create_community(TEXT, TEXT, TEXT, TEXT, UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_create_community(TEXT, TEXT, TEXT, TEXT, UUID, UUID) TO authenticated, service_role;

ALTER FUNCTION public.rpc_get_user_bookmarks(TEXT, INT, TIMESTAMPTZ, UUID) SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.rpc_get_user_bookmarks(TEXT, INT, TIMESTAMPTZ, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_get_user_bookmarks(TEXT, INT, TIMESTAMPTZ, UUID) TO authenticated, service_role;

ALTER FUNCTION public.delete_own_account() SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.delete_own_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated, service_role;

ALTER FUNCTION public.get_home_feed(TEXT, INT, TIMESTAMPTZ, UUID) SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.get_home_feed(TEXT, INT, TIMESTAMPTZ, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_home_feed(TEXT, INT, TIMESTAMPTZ, UUID) TO anon, authenticated, service_role;

ALTER FUNCTION public.search_questions_fts(TEXT, INT) SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.search_questions_fts(TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_questions_fts(TEXT, INT) TO anon, authenticated, service_role;

ALTER FUNCTION public.get_related_questions(UUID, INT) SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.get_related_questions(UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_related_questions(UUID, INT) TO anon, authenticated, service_role;

ALTER FUNCTION public.purge_expired_operational_data() SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.purge_expired_operational_data() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purge_expired_operational_data() TO authenticated, service_role;

ALTER FUNCTION public.rpc_create_post(TEXT, UUID, UUID[], TEXT[], content_visibility_enum) SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.rpc_create_post(TEXT, UUID, UUID[], TEXT[], content_visibility_enum) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_create_post(TEXT, UUID, UUID[], TEXT[], content_visibility_enum) TO authenticated, service_role;

-- 3. Idempotency Keys (Per-Author Uniqueness)
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS client_mutation_id UUID;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS client_mutation_id UUID;
ALTER TABLE public.answers ADD COLUMN IF NOT EXISTS client_mutation_id UUID;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS client_mutation_id UUID;
ALTER TABLE public.reactions ADD COLUMN IF NOT EXISTS client_mutation_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS uq_questions_author_mutation_id ON public.questions (author_id, client_mutation_id) WHERE client_mutation_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_posts_author_mutation_id ON public.posts (author_id, client_mutation_id) WHERE client_mutation_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_answers_author_mutation_id ON public.answers (author_id, client_mutation_id) WHERE client_mutation_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_comments_author_mutation_id ON public.comments (author_id, client_mutation_id) WHERE client_mutation_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_reactions_user_mutation_id ON public.reactions (user_id, client_mutation_id) WHERE client_mutation_id IS NOT NULL;

DROP FUNCTION IF EXISTS public.rpc_create_question(TEXT, TEXT, UUID, UUID[], TEXT[]);
CREATE OR REPLACE FUNCTION public.rpc_create_question(
    p_title TEXT, 
    p_body TEXT, 
    p_community_id UUID DEFAULT NULL, 
    p_topic_ids UUID[] DEFAULT ARRAY[]::UUID[], 
    p_image_paths TEXT[] DEFAULT ARRAY[]::TEXT[], 
    p_client_mutation_id UUID DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_question_id UUID;
    v_topic_id UUID;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
    END IF;

    IF p_client_mutation_id IS NOT NULL THEN
        SELECT id INTO v_question_id FROM public.questions WHERE client_mutation_id = p_client_mutation_id AND author_id = v_user_id;
        IF v_question_id IS NOT NULL THEN
            RETURN v_question_id;
        END IF;
    END IF;

    INSERT INTO public.questions (author_id, community_id, title, body, image_paths, client_mutation_id)
    VALUES (v_user_id, p_community_id, p_title, p_body, p_image_paths, p_client_mutation_id)
    ON CONFLICT (author_id, client_mutation_id) WHERE client_mutation_id IS NOT NULL DO NOTHING
    RETURNING id INTO v_question_id;

    IF v_question_id IS NULL AND p_client_mutation_id IS NOT NULL THEN
        SELECT id INTO v_question_id FROM public.questions WHERE client_mutation_id = p_client_mutation_id AND author_id = v_user_id;
        RETURN v_question_id;
    END IF;

    IF p_topic_ids IS NOT NULL AND array_length(p_topic_ids, 1) > 0 THEN
        FOREACH v_topic_id IN ARRAY p_topic_ids LOOP
            INSERT INTO public.question_topics (question_id, topic_id) SELECT v_question_id, t.id FROM public.topics t WHERE t.id = v_topic_id ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    RETURN v_question_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.rpc_create_question(TEXT, TEXT, UUID, UUID[], TEXT[], UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_create_question(TEXT, TEXT, UUID, UUID[], TEXT[], UUID) TO authenticated, service_role;

DROP FUNCTION IF EXISTS public.rpc_create_post(TEXT, UUID, UUID[], TEXT[], content_visibility_enum);
CREATE OR REPLACE FUNCTION public.rpc_create_post(
    p_body TEXT,
    p_community_id UUID DEFAULT NULL,
    p_topic_ids UUID[] DEFAULT ARRAY[]::UUID[],
    p_image_paths TEXT[] DEFAULT ARRAY[]::TEXT[],
    p_visibility content_visibility_enum DEFAULT 'public',
    p_client_mutation_id UUID DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_post_id UUID;
    v_topic_id UUID;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
    END IF;

    IF p_client_mutation_id IS NOT NULL THEN
        SELECT id INTO v_post_id FROM public.posts WHERE client_mutation_id = p_client_mutation_id AND author_id = v_user_id;
        IF v_post_id IS NOT NULL THEN
            RETURN v_post_id;
        END IF;
    END IF;

    INSERT INTO public.posts (
        author_id,
        community_id,
        body,
        image_paths,
        visibility,
        client_mutation_id
    )
    VALUES (
        v_user_id,
        p_community_id,
        p_body,
        p_image_paths,
        p_visibility,
        p_client_mutation_id
    )
    ON CONFLICT (author_id, client_mutation_id) WHERE client_mutation_id IS NOT NULL DO NOTHING
    RETURNING id INTO v_post_id;

    IF v_post_id IS NULL AND p_client_mutation_id IS NOT NULL THEN
        SELECT id INTO v_post_id FROM public.posts WHERE client_mutation_id = p_client_mutation_id AND author_id = v_user_id;
        RETURN v_post_id;
    END IF;

    IF p_topic_ids IS NOT NULL AND array_length(p_topic_ids, 1) > 0 THEN
        FOREACH v_topic_id IN ARRAY p_topic_ids LOOP
            INSERT INTO public.post_topics (post_id, topic_id)
            SELECT v_post_id, t.id
            FROM public.topics t
            WHERE t.id = v_topic_id
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    RETURN v_post_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.rpc_create_post(TEXT, UUID, UUID[], TEXT[], content_visibility_enum, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_create_post(TEXT, UUID, UUID[], TEXT[], content_visibility_enum, UUID) TO authenticated, service_role;

-- 4. Global Soft-Delete RLS Enforcement
-- Questions
DROP POLICY IF EXISTS "Authors and mods update questions" ON public.questions;
CREATE POLICY "Authors and mods update questions" ON public.questions 
FOR UPDATE 
USING (deleted_at IS NULL AND ((select auth.uid()) = author_id OR (community_id IS NOT NULL AND public.is_community_mod(community_id)) OR (select public.is_admin()))) 
WITH CHECK ((select auth.uid()) = author_id OR (community_id IS NOT NULL AND public.is_community_mod(community_id)) OR (select public.is_admin()));

-- Posts
DROP POLICY IF EXISTS "Authors and mods update posts" ON public.posts;
CREATE POLICY "Authors and mods update posts" ON public.posts 
FOR UPDATE 
USING (deleted_at IS NULL AND ((select auth.uid()) = author_id OR (community_id IS NOT NULL AND public.is_community_mod(community_id)) OR (select public.is_admin()))) 
WITH CHECK ((select auth.uid()) = author_id OR (community_id IS NOT NULL AND public.is_community_mod(community_id)) OR (select public.is_admin()));

-- Answers
DROP POLICY IF EXISTS "Authors and mods update answers" ON public.answers;
CREATE POLICY "Authors and mods update answers" ON public.answers 
FOR UPDATE 
USING (deleted_at IS NULL AND ((select auth.uid()) = author_id OR (select public.is_moderator()))) 
WITH CHECK ((select auth.uid()) = author_id OR (select public.is_moderator()));

-- Comments
DROP POLICY IF EXISTS "Authors and mods update comments" ON public.comments;
CREATE POLICY "Authors and mods update comments" ON public.comments 
FOR UPDATE 
USING (deleted_at IS NULL AND ((select auth.uid()) = author_id OR (select public.is_moderator()))) 
WITH CHECK ((select auth.uid()) = author_id OR (select public.is_moderator()));

-- 5. Soft-Delete Cron Cleanup
CREATE OR REPLACE FUNCTION public.purge_soft_deleted_content()
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_total_deleted BIGINT := 0;
    v_deleted BIGINT;
BEGIN
    IF session_user NOT IN ('postgres', 'supabase_admin', 'service_role')
       AND (auth.role() IS NULL OR auth.role() != 'service_role')
       AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only platform administrators can invoke operational data retention purges.' USING ERRCODE = '42501';
    END IF;

    -- Delete comments older than 30 days
    LOOP
        WITH victims AS (
            SELECT id FROM public.comments
            WHERE deleted_at < TIMEZONE('utc', NOW()) - INTERVAL '30 days'
            ORDER BY deleted_at
            LIMIT 5000
            FOR UPDATE SKIP LOCKED
        )
        DELETE FROM public.comments c USING victims WHERE c.id = victims.id;
        GET DIAGNOSTICS v_deleted = ROW_COUNT;
        v_total_deleted := v_total_deleted + v_deleted;
        EXIT WHEN v_deleted < 5000;
    END LOOP;

    -- Delete answers older than 30 days (or attached to soft-deleted questions older than 30 days)
    LOOP
        WITH victims AS (
            SELECT a.id FROM public.answers a
            WHERE a.deleted_at < TIMEZONE('utc', NOW()) - INTERVAL '30 days'
               OR EXISTS (
                   SELECT 1 FROM public.questions q
                   WHERE q.id = a.question_id
                     AND q.deleted_at < TIMEZONE('utc', NOW()) - INTERVAL '30 days'
               )
            ORDER BY a.deleted_at NULLS LAST
            LIMIT 5000
            FOR UPDATE SKIP LOCKED
        )
        , clear_accepted AS (
            UPDATE public.questions q
            SET accepted_answer_id = NULL
            FROM victims
            WHERE q.accepted_answer_id = victims.id
        )
        , del_comments AS (
            DELETE FROM public.comments c
            USING victims
            WHERE c.answer_id = victims.id
        )
        DELETE FROM public.answers a USING victims WHERE a.id = victims.id;
        GET DIAGNOSTICS v_deleted = ROW_COUNT;
        v_total_deleted := v_total_deleted + v_deleted;
        EXIT WHEN v_deleted < 5000;
    END LOOP;

    -- Delete questions older than 30 days
    LOOP
        WITH victims AS (
            SELECT id FROM public.questions
            WHERE deleted_at < TIMEZONE('utc', NOW()) - INTERVAL '30 days'
            ORDER BY deleted_at
            LIMIT 5000
            FOR UPDATE SKIP LOCKED
        )
        , clear_accepted AS (
            UPDATE public.questions q
            SET accepted_answer_id = NULL
            FROM victims
            WHERE q.id = victims.id
        )
        , del_answers AS (
            DELETE FROM public.answers a
            USING victims
            WHERE a.question_id = victims.id
        )
        , del_comments AS (
            DELETE FROM public.comments c
            USING victims
            WHERE c.question_id = victims.id
        )
        DELETE FROM public.questions q USING victims WHERE q.id = victims.id;
        GET DIAGNOSTICS v_deleted = ROW_COUNT;
        v_total_deleted := v_total_deleted + v_deleted;
        EXIT WHEN v_deleted < 5000;
    END LOOP;

    -- Delete posts older than 30 days
    LOOP
        WITH victims AS (
            SELECT id FROM public.posts
            WHERE deleted_at < TIMEZONE('utc', NOW()) - INTERVAL '30 days'
            ORDER BY deleted_at
            LIMIT 5000
            FOR UPDATE SKIP LOCKED
        )
        , del_comments AS (
            DELETE FROM public.comments c
            USING victims
            WHERE c.post_id = victims.id
        )
        DELETE FROM public.posts p USING victims WHERE p.id = victims.id;
        GET DIAGNOSTICS v_deleted = ROW_COUNT;
        v_total_deleted := v_total_deleted + v_deleted;
        EXIT WHEN v_deleted < 5000;
    END LOOP;

    RETURN v_total_deleted;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.purge_soft_deleted_content() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purge_soft_deleted_content() TO authenticated, service_role;

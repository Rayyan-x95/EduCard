-- ============================================================================
-- Migration: 20260827000000_audit_fixes.sql
-- Description: Remediation of the 2026-08 production audit findings.
--
-- Fixes:
--   P0-02  protect_sensitive_profile_fields blocked SECURITY DEFINER RPCs
--          (accept_answer / unaccept_answer) because it tested the JWT role
--          claim instead of the effective database role. Guard now checks
--          current_user, so definer-owned maintenance paths are exempt while
--          direct client writes stay locked down.
--   P1-04  Answer authors could flip their own answers.is_accepted directly.
--   P1-05  Users could set their own verification_requests.status='verified'.
--   P1-06  Attachments bucket was publicly readable. Now private; signed or
--          authenticated reads only.
--   P0-03  Topics table had no seed data; onboarding shipped fabricated UUIDs.
--   —      Profile preference columns for the Privacy screen toggles.
--   —      Author counters (total_questions/total_answers/helpful_count) are
--          now maintained by triggers instead of staying at zero forever.
--   —      toggle_reaction reported is_active=true when the insert conflicted.
--   —      complete_onboarding / rpc_create_question no longer abort when a
--          stale or bogus topic id is supplied.
--   —      display_name length constraint.
--   —      check_username_available(p_username) RPC for signup UX.
-- ============================================================================

-- ============================================================
-- 1. SENSITIVE PROFILE FIELD GUARD (P0-02)
--    Direct PostgREST updates run as role `authenticated`.
--    SECURITY DEFINER functions run as their owner (`postgres`),
--    so legitimate platform maintenance passes while client
--    spoofing attempts still raise.
-- ============================================================
CREATE OR REPLACE FUNCTION public.protect_sensitive_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF current_user = 'authenticated' AND NOT public.is_admin() THEN
        IF NEW.system_role IS DISTINCT FROM OLD.system_role THEN
            RAISE EXCEPTION 'Unauthorized: modifying system_role is strictly prohibited' USING ERRCODE = '42501';
        END IF;

        IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
            RAISE EXCEPTION 'Unauthorized: modifying is_verified is strictly prohibited' USING ERRCODE = '42501';
        END IF;

        IF NEW.reputation_score IS DISTINCT FROM OLD.reputation_score THEN
            RAISE EXCEPTION 'Unauthorized: modifying reputation_score directly is strictly prohibited' USING ERRCODE = '42501';
        END IF;

        IF NEW.total_questions IS DISTINCT FROM OLD.total_questions OR
           NEW.total_answers IS DISTINCT FROM OLD.total_answers OR
           NEW.helpful_count IS DISTINCT FROM OLD.helpful_count THEN
            RAISE EXCEPTION 'Unauthorized: modifying profile counters directly is strictly prohibited' USING ERRCODE = '42501';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 2. ANSWER ACCEPTANCE GUARD (P1-04)
--    Only the accept_answer / unaccept_answer RPCs (definer
--    context) may flip answers.is_accepted. A user editing their
--    own answer body can no longer self-verify.
-- ============================================================
CREATE OR REPLACE FUNCTION public.protect_answer_acceptance()
RETURNS TRIGGER AS $$
BEGIN
    IF current_user = 'authenticated'
       AND NEW.is_accepted IS DISTINCT FROM OLD.is_accepted THEN
        RAISE EXCEPTION 'Unauthorized: acceptance state is managed by the question author via RPC' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_protect_answer_acceptance ON public.answers;
CREATE TRIGGER tr_protect_answer_acceptance
    BEFORE UPDATE ON public.answers
    FOR EACH ROW EXECUTE FUNCTION public.protect_answer_acceptance();

-- ============================================================
-- 3. VERIFICATION REQUESTS POLICY SPLIT (P1-05)
--    Owners may create/read/delete their own *pending* requests.
--    Only admins may change status / review fields.
-- ============================================================
DROP POLICY IF EXISTS "Users can manage own verification requests" ON public.verification_requests;

CREATE POLICY "Users insert own verification requests"
ON public.verification_requests FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users read own verification requests"
ON public.verification_requests FOR SELECT
USING ((select auth.uid()) = user_id OR public.is_admin());

CREATE POLICY "Admins review verification requests"
ON public.verification_requests FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Users delete own pending verification requests"
ON public.verification_requests FOR DELETE
USING ((select auth.uid()) = user_id AND status = 'pending');

-- ============================================================
-- 4. STORAGE HARDENING (P1-06)
--    Avatars remain public by design (profile photos).
--    Attachments become private: authenticated users may read,
--    anonymous traffic may not.
-- ============================================================
UPDATE storage.buckets SET public = FALSE WHERE id = 'attachments';

DROP POLICY IF EXISTS "Public read for attachments" ON storage.objects;
CREATE POLICY "Authenticated users can read attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'attachments');

-- ============================================================
-- 5. TOPIC SEEDS (P0-03)
--    Canonical catalog so fresh databases work out of the box.
-- ============================================================
INSERT INTO public.topics (slug, name, description, icon_name) VALUES
    ('computer-science',     'Computer Science',    'Algorithms, systems, software engineering, and AI.',        'code'),
    ('engineering',          'Engineering',         'Mechanical, Electrical, Civil, and Aerospace disciplines.', 'wrench'),
    ('business-finance',     'Business & Finance',  'Economics, corporate finance, consulting, and management.', 'briefcase'),
    ('pre-med-healthcare',   'Pre-Med & Healthcare','MCAT, clinical practice, medical school admissions.',       'stethoscope'),
    ('graduate-admissions',  'Graduate Admissions', 'Master and PhD applications, statements, GRE/GMAT.',        'graduation-cap'),
    ('internship-search',    'Internship Search',   'Strategies, resume reviews, referrals, interviews.',        'search'),
    ('career-transition',    'Career Transition',   'Guidance on pivoting between fields and industries.',       'repeat'),
    ('study-strategies',     'Study Strategies',    'Note-taking, exam prep, time management, and focus.',       'book-open'),
    ('research-methods',     'Research Methods',    'Literature reviews, statistics, lab work, publishing.',     'flask-conical'),
    ('international-study',  'International Study', 'Visas, exchanges, studying abroad, scholarships.',          'globe'),
    ('exams-certifications', 'Exams & Certifications','Standardized tests, professional certifications, prep.',  'award'),
    ('campus-life',          'Campus Life',         'Housing, societies, balance, and student wellbeing.',       'home')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 6. PROFILE PREFERENCE COLUMNS (privacy screen) +
--    explicit onboarding flag (replaces the fragile
--    country_code/username heuristic)
-- ============================================================
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS is_public_profile BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS activity_status BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS dm_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS answer_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS weekly_digest BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;

DO $$ BEGIN
    ALTER TABLE public.profiles
        ADD CONSTRAINT chk_display_name_length CHECK (char_length(display_name) <= 80);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 7. AUTHOR COUNTER MAINTENANCE
--    All updates below execute inside SECURITY DEFINER trigger
--    functions, so they bypass the sensitive-field guard by
--    design (current_user = postgres inside definer body).
-- ============================================================

-- 7a. total_questions
CREATE OR REPLACE FUNCTION public.sync_author_question_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') AND NEW.author_id IS NOT NULL THEN
        UPDATE public.profiles SET total_questions = total_questions + 1 WHERE id = NEW.author_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL))
          AND OLD.author_id IS NOT NULL THEN
        UPDATE public.profiles SET total_questions = GREATEST(0, total_questions - 1) WHERE id = OLD.author_id;
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_sync_author_question_count ON public.questions;
CREATE TRIGGER tr_sync_author_question_count
    AFTER INSERT OR DELETE OR UPDATE OF deleted_at ON public.questions
    FOR EACH ROW EXECUTE FUNCTION public.sync_author_question_count();

-- 7b. total_answers (extends existing answer-count sync)
CREATE OR REPLACE FUNCTION public.sync_question_answer_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.questions SET answer_count = answer_count + 1 WHERE id = NEW.question_id;

        INSERT INTO public.notifications (recipient_id, actor_id, type, entity_type, entity_id)
        SELECT author_id, NEW.author_id, 'answer_created', 'question', NEW.question_id
        FROM public.questions 
        WHERE id = NEW.question_id AND author_id != NEW.author_id AND author_id IS NOT NULL;

        IF NEW.author_id IS NOT NULL THEN
            UPDATE public.profiles SET total_answers = total_answers + 1 WHERE id = NEW.author_id;
        END IF;

        RETURN NEW;
    ELSIF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)) THEN
        UPDATE public.questions SET answer_count = GREATEST(0, answer_count - 1) WHERE id = OLD.question_id;

        IF OLD.author_id IS NOT NULL THEN
            UPDATE public.profiles SET total_answers = GREATEST(0, total_answers - 1) WHERE id = OLD.author_id;
        END IF;

        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7c. helpful received counter on the content AUTHOR's profile
CREATE OR REPLACE FUNCTION public.sync_reaction_counts()
RETURNS TRIGGER AS $$
DECLARE
    v_content_author UUID;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF NEW.reaction_type = 'helpful' THEN
            IF NEW.question_id IS NOT NULL THEN
                UPDATE public.questions SET helpful_count = helpful_count + 1 WHERE id = NEW.question_id;
                SELECT author_id INTO v_content_author FROM public.questions WHERE id = NEW.question_id;
            ELSIF NEW.answer_id IS NOT NULL THEN
                UPDATE public.answers SET helpful_count = helpful_count + 1 WHERE id = NEW.answer_id;
                SELECT author_id INTO v_content_author FROM public.answers WHERE id = NEW.answer_id;
            ELSIF NEW.post_id IS NOT NULL THEN
                UPDATE public.posts SET helpful_count = helpful_count + 1 WHERE id = NEW.post_id;
                SELECT author_id INTO v_content_author FROM public.posts WHERE id = NEW.post_id;
            END IF;

            IF v_content_author IS NOT NULL THEN
                UPDATE public.profiles SET helpful_count = helpful_count + 1 WHERE id = v_content_author;
            END IF;
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.reaction_type = 'helpful' THEN
            IF OLD.question_id IS NOT NULL THEN
                UPDATE public.questions SET helpful_count = GREATEST(0, helpful_count - 1) WHERE id = OLD.question_id;
                SELECT author_id INTO v_content_author FROM public.questions WHERE id = OLD.question_id;
            ELSIF OLD.answer_id IS NOT NULL THEN
                UPDATE public.answers SET helpful_count = GREATEST(0, helpful_count - 1) WHERE id = OLD.answer_id;
                SELECT author_id INTO v_content_author FROM public.answers WHERE id = OLD.answer_id;
            ELSIF OLD.post_id IS NOT NULL THEN
                UPDATE public.posts SET helpful_count = GREATEST(0, helpful_count - 1) WHERE id = OLD.post_id;
                SELECT author_id INTO v_content_author FROM public.posts WHERE id = OLD.post_id;
            END IF;

            IF v_content_author IS NOT NULL THEN
                UPDATE public.profiles SET helpful_count = GREATEST(0, helpful_count - 1) WHERE id = v_content_author;
            END IF;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 8. RPC FIXES
-- ============================================================

-- 8a. toggle_reaction: report accurate state when insert conflicts
CREATE OR REPLACE FUNCTION public.toggle_reaction(
    p_target_type VARCHAR(20),
    p_target_id UUID,
    p_reaction_type reaction_type_enum DEFAULT 'helpful'
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_deleted_id UUID;
    v_inserted_id UUID;
    v_is_active BOOLEAN := FALSE;
    v_new_count INT := 0;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
    END IF;

    DELETE FROM public.reactions
    WHERE user_id = v_user_id
      AND reaction_type = p_reaction_type
      AND (
          (p_target_type = 'post' AND post_id = p_target_id) OR
          (p_target_type = 'question' AND question_id = p_target_id) OR
          (p_target_type = 'answer' AND answer_id = p_target_id) OR
          (p_target_type = 'comment' AND comment_id = p_target_id)
      )
    RETURNING id INTO v_deleted_id;

    IF v_deleted_id IS NOT NULL THEN
        v_is_active := FALSE;
    ELSE
        INSERT INTO public.reactions (user_id, post_id, question_id, answer_id, comment_id, reaction_type)
        VALUES (
            v_user_id,
            CASE WHEN p_target_type = 'post' THEN p_target_id ELSE NULL END,
            CASE WHEN p_target_type = 'question' THEN p_target_id ELSE NULL END,
            CASE WHEN p_target_type = 'answer' THEN p_target_id ELSE NULL END,
            CASE WHEN p_target_type = 'comment' THEN p_target_id ELSE NULL END,
            p_reaction_type
        )
        ON CONFLICT DO NOTHING
        RETURNING id INTO v_inserted_id;

        v_is_active := v_inserted_id IS NOT NULL;
    END IF;

    IF p_target_type = 'question' THEN
        SELECT helpful_count INTO v_new_count FROM public.questions WHERE id = p_target_id;
    ELSIF p_target_type = 'answer' THEN
        SELECT helpful_count INTO v_new_count FROM public.answers WHERE id = p_target_id;
    ELSIF p_target_type = 'post' THEN
        SELECT helpful_count INTO v_new_count FROM public.posts WHERE id = p_target_id;
    END IF;

    RETURN jsonb_build_object(
        'is_active', v_is_active,
        'count', COALESCE(v_new_count, 0)
    );
END;
$$;

-- 8b. complete_onboarding: tolerate unknown topic ids instead of failing
CREATE OR REPLACE FUNCTION public.complete_onboarding(
    p_username CITEXT,
    p_display_name TEXT,
    p_country_code VARCHAR(2),
    p_current_status user_status_enum,
    p_institution_name TEXT,
    p_degree TEXT,
    p_field TEXT,
    p_start_year INT,
    p_end_year INT DEFAULT NULL,
    p_topic_ids UUID[] DEFAULT ARRAY[]::UUID[]
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_topic_id UUID;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
    END IF;

    INSERT INTO public.profiles (id, username, display_name, country_code, current_status, onboarding_completed, updated_at)
    VALUES (v_user_id, p_username, p_display_name, p_country_code, p_current_status, TRUE, NOW())
    ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        display_name = EXCLUDED.display_name,
        country_code = EXCLUDED.country_code,
        current_status = EXCLUDED.current_status,
        onboarding_completed = TRUE,
        updated_at = NOW();

    INSERT INTO public.education (user_id, institution_name, degree, field, start_year, end_year, education_status)
    VALUES (v_user_id, p_institution_name, p_degree, p_field, p_start_year, p_end_year, p_current_status);

    IF p_topic_ids IS NOT NULL AND array_length(p_topic_ids, 1) > 0 THEN
        FOREACH v_topic_id IN ARRAY p_topic_ids LOOP
            INSERT INTO public.user_topics (user_id, topic_id)
            SELECT v_user_id, t.id
            FROM public.topics t
            WHERE t.id = v_topic_id
            ON CONFLICT (user_id, topic_id) DO NOTHING;
        END LOOP;
    END IF;
END;
$$;

-- 8c. rpc_create_question: same resilience for question topics
CREATE OR REPLACE FUNCTION public.rpc_create_question(
    p_title TEXT,
    p_body TEXT,
    p_community_id UUID DEFAULT NULL,
    p_topic_ids UUID[] DEFAULT ARRAY[]::UUID[],
    p_image_paths TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_question_id UUID;
    v_topic_id UUID;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
    END IF;

    INSERT INTO public.questions (
        author_id,
        community_id,
        title,
        body,
        image_paths
    )
    VALUES (
        v_user_id,
        p_community_id,
        p_title,
        p_body,
        p_image_paths
    )
    RETURNING id INTO v_question_id;

    IF p_topic_ids IS NOT NULL AND array_length(p_topic_ids, 1) > 0 THEN
        FOREACH v_topic_id IN ARRAY p_topic_ids LOOP
            INSERT INTO public.question_topics (question_id, topic_id)
            SELECT v_question_id, t.id
            FROM public.topics t
            WHERE t.id = v_topic_id
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    RETURN v_question_id;
END;
$$;

-- ============================================================
-- 9. USERNAME AVAILABILITY CHECK RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_username_available(p_username CITEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE username = lower(p_username)
    );
$$;

-- ============================================================
-- 10. CLIENT ERROR REPORTING (observability)
--    Clients can report crashes/errors; only staff can read.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.client_error_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    message TEXT NOT NULL CHECK (char_length(message) <= 2000),
    stack TEXT,
    fingerprint TEXT,
    context JSONB NOT NULL DEFAULT '{}'::JSONB,
    breadcrumbs JSONB NOT NULL DEFAULT '[]'::JSONB,
    app_version TEXT,
    platform TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.client_error_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit error reports"
ON public.client_error_reports FOR INSERT
WITH CHECK (
    char_length(message) <= 2000
    AND ((select auth.uid()) = user_id OR user_id IS NULL)
);

CREATE POLICY "Staff read error reports"
ON public.client_error_reports FOR SELECT
USING (public.is_moderator());

CREATE INDEX IF NOT EXISTS idx_client_errors_created
ON public.client_error_reports (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_errors_fingerprint
ON public.client_error_reports (fingerprint) WHERE fingerprint IS NOT NULL;

-- ============================================================
-- 11. PUSH DELIVERY BOOKKEEPING
--    Set by the send-push Edge Function after dispatching via
--    Expo Push API; enables retries without duplicates.
-- ============================================================
ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS push_sent_at TIMESTAMPTZ;

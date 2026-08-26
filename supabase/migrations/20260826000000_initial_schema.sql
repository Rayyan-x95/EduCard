-- ============================================================================
-- Supabase Migration: 20260826000000_initial_schema.sql
-- Description: High-Performance, Optimized Database Architecture for EduCard.
-- Includes native UUIDs, composite partial indexes, trigram search GINs,
-- keyset pagination indexes, CDC replica identity, and parallel-safe RPCs.
-- ============================================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ============================================================
-- 2. ENUM TYPES
-- ============================================================
DO $$ BEGIN
    CREATE TYPE user_status_enum AS ENUM (
        'high_school',
        'undergraduate',
        'postgraduate',
        'vocational',
        'alumni',
        'professional',
        'mentor',
        'other'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE question_status_enum AS ENUM (
        'open',
        'solved',
        'closed'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE content_visibility_enum AS ENUM (
        'public',
        'community',
        'unlisted',
        'removed'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE reaction_type_enum AS ENUM (
        'helpful',
        'upvote',
        'like'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE report_reason_enum AS ENUM (
        'harassment',
        'bullying',
        'hate_speech',
        'sexual_content',
        'threats',
        'self_harm',
        'spam',
        'scam',
        'impersonation',
        'misinformation',
        'academic_dishonesty',
        'other'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE report_status_enum AS ENUM (
        'pending',
        'investigating',
        'resolved',
        'dismissed'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE moderation_action_enum AS ENUM (
        'content_removed',
        'content_flagged',
        'user_warned',
        'user_restricted',
        'user_suspended',
        'user_banned',
        'report_dismissed'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE system_role_enum AS ENUM (
        'user',
        'moderator',
        'admin'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE verification_status_enum AS ENUM (
        'unverified',
        'pending',
        'verified',
        'rejected',
        'revoked'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE verification_type_enum AS ENUM (
        'student_email',
        'alumni_diploma',
        'professional_id',
        'mentor_credential'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================
-- 3. CORE TABLES (Optimized Column Alignment & Native UUIDs)
-- ============================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username CITEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    bio TEXT CHECK (char_length(bio) <= 300),
    avatar_path TEXT,
    country_code VARCHAR(2),
    current_status user_status_enum NOT NULL DEFAULT 'undergraduate',
    system_role system_role_enum NOT NULL DEFAULT 'user',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    reputation_score INT NOT NULL DEFAULT 0,
    total_questions INT NOT NULL DEFAULT 0,
    total_answers INT NOT NULL DEFAULT 0,
    helpful_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    deleted_at TIMESTAMPTZ
);

-- 2. Universities Table
CREATE TABLE IF NOT EXISTS public.universities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    country_code VARCHAR(2) NOT NULL,
    domain CITEXT,
    website TEXT,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Education Table
CREATE TABLE IF NOT EXISTS public.education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL,
    institution_name TEXT NOT NULL,
    degree TEXT NOT NULL,
    field TEXT NOT NULL,
    start_year INT NOT NULL CHECK (start_year >= 1950 AND start_year <= 2100),
    end_year INT CHECK (end_year >= start_year AND end_year <= 2100),
    education_status user_status_enum NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 4. Topics Table
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug CITEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 5. User Topics Bridge
CREATE TABLE IF NOT EXISTS public.user_topics (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    PRIMARY KEY (user_id, topic_id)
);

-- 6. Communities Table
CREATE TABLE IF NOT EXISTS public.communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug CITEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    rules TEXT,
    university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    member_count INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 7. Community Members Table
CREATE TABLE IF NOT EXISTS public.community_members (
    community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    PRIMARY KEY (community_id, user_id)
);

-- 8. Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
    body TEXT NOT NULL CHECK (char_length(body) >= 5 AND char_length(body) <= 5000),
    visibility content_visibility_enum NOT NULL DEFAULT 'public',
    image_paths TEXT[] DEFAULT ARRAY[]::TEXT[],
    helpful_count INT NOT NULL DEFAULT 0,
    comment_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    deleted_at TIMESTAMPTZ
);

-- 9. Questions Table
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
    title TEXT NOT NULL CHECK (char_length(title) >= 10 AND char_length(title) <= 200),
    body TEXT NOT NULL CHECK (char_length(body) >= 20 AND char_length(body) <= 10000),
    status question_status_enum NOT NULL DEFAULT 'open',
    accepted_answer_id UUID,
    solved_at TIMESTAMPTZ,
    answer_count INT NOT NULL DEFAULT 0,
    helpful_count INT NOT NULL DEFAULT 0,
    image_paths TEXT[] DEFAULT ARRAY[]::TEXT[],
    fts TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(body, '')), 'B')
    ) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    deleted_at TIMESTAMPTZ
);

-- 10. Question Topics Bridge
CREATE TABLE IF NOT EXISTS public.question_topics (
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE RESTRICT,
    PRIMARY KEY (question_id, topic_id)
);

-- 11. Answers Table
CREATE TABLE IF NOT EXISTS public.answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    body TEXT NOT NULL CHECK (char_length(body) >= 10 AND char_length(body) <= 10000),
    is_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    helpful_count INT NOT NULL DEFAULT 0,
    comment_count INT NOT NULL DEFAULT 0,
    image_paths TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    deleted_at TIMESTAMPTZ
);

-- Circular FK from questions to answers with DEFERRABLE
DO $$ BEGIN
    ALTER TABLE public.questions 
        ADD CONSTRAINT fk_questions_accepted_answer 
        FOREIGN KEY (accepted_answer_id) 
        REFERENCES public.answers(id) 
        ON DELETE SET NULL 
        DEFERRABLE INITIALLY DEFERRED;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 12. Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    answer_id UUID REFERENCES public.answers(id) ON DELETE CASCADE,
    body TEXT NOT NULL CHECK (char_length(body) >= 1 AND char_length(body) <= 1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT chk_comment_target_exclusive CHECK (
        (CASE WHEN post_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN question_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN answer_id IS NOT NULL THEN 1 ELSE 0 END) = 1
    )
);

-- 13. Reactions Table
CREATE TABLE IF NOT EXISTS public.reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    answer_id UUID REFERENCES public.answers(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    reaction_type reaction_type_enum NOT NULL DEFAULT 'helpful',
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT chk_reaction_target_exclusive CHECK (
        (CASE WHEN post_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN question_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN answer_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN comment_id IS NOT NULL THEN 1 ELSE 0 END) = 1
    ),
    CONSTRAINT uq_user_target_reaction UNIQUE NULLS NOT DISTINCT (user_id, post_id, question_id, answer_id, comment_id, reaction_type)
);

-- 14. Follows Table
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT chk_no_self_follow CHECK (follower_id != following_id)
);

-- 15. Bookmarks Table
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT chk_bookmark_target_exclusive CHECK (
        (CASE WHEN post_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN question_id IS NOT NULL THEN 1 ELSE 0 END) = 1
    ),
    CONSTRAINT uq_user_target_bookmark UNIQUE NULLS NOT DISTINCT (user_id, post_id, question_id)
);

-- 16. Push Tokens Table
CREATE TABLE IF NOT EXISTS public.push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    expo_push_token TEXT NOT NULL,
    device_os VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT uq_user_push_token UNIQUE (user_id, expo_push_token)
);

-- 17. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type VARCHAR(30) NOT NULL,
    entity_type VARCHAR(20) NOT NULL,
    entity_id UUID NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 18. Blocks Table
CREATE TABLE IF NOT EXISTS public.blocks (
    blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    PRIMARY KEY (blocker_id, blocked_id),
    CONSTRAINT chk_no_self_block CHECK (blocker_id != blocked_id)
);

-- 19. Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    answer_id UUID REFERENCES public.answers(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason report_reason_enum NOT NULL,
    details TEXT CHECK (char_length(details) <= 1000),
    status report_status_enum NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT chk_report_target_exclusive CHECK (
        (CASE WHEN post_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN question_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN answer_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN comment_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN profile_id IS NOT NULL THEN 1 ELSE 0 END) = 1
    )
);

-- 20. Verification Requests Table
CREATE TABLE IF NOT EXISTS public.verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    verification_type verification_type_enum NOT NULL,
    evidence_path TEXT,
    institutional_email CITEXT,
    status verification_status_enum NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 21. Moderation Audit Logs Table
CREATE TABLE IF NOT EXISTS public.moderation_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moderator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action moderation_action_enum NOT NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    answer_id UUID REFERENCES public.answers(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT chk_audit_target_exclusive CHECK (
        (CASE WHEN post_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN question_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN answer_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN comment_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN profile_id IS NOT NULL THEN 1 ELSE 0 END) = 1
    )
);


-- ============================================================
-- 4. HIGH-PERFORMANCE INDEXING STRATEGY
-- ============================================================

-- A. Keyset Feed Composite Partial Indexes
CREATE INDEX IF NOT EXISTS idx_questions_feed_pagination ON public.questions (created_at DESC, id DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_questions_unsolved_feed ON public.questions (created_at DESC, id DESC) WHERE deleted_at IS NULL AND status = 'open';
CREATE INDEX IF NOT EXISTS idx_posts_feed_pagination ON public.posts (created_at DESC, id DESC) WHERE deleted_at IS NULL AND visibility = 'public';

-- B. Trigram & Full-Text Search GIN Indexes
CREATE INDEX IF NOT EXISTS idx_questions_fts ON public.questions USING GIN(fts);
CREATE INDEX IF NOT EXISTS idx_questions_title_trgm ON public.questions USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_topics_name_trgm ON public.topics USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_communities_name_trgm ON public.communities USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_username_trgm ON public.profiles USING gin (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name_trgm ON public.profiles USING gin (display_name gin_trgm_ops);

-- C. Foreign Key & Query Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_education_user_id ON public.education(user_id);
CREATE INDEX IF NOT EXISTS idx_education_university_id ON public.education(university_id);
CREATE INDEX IF NOT EXISTS idx_education_user_feed ON public.education (user_id, created_at DESC) WHERE university_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_questions_author ON public.questions(author_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_questions_status_created ON public.questions(status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_questions_community ON public.questions(community_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_question_topics_topic ON public.question_topics(topic_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON public.answers(question_id, created_at ASC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_answers_author ON public.answers(author_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_community ON public.posts(community_id, created_at DESC) WHERE deleted_at IS NULL;

-- D. Polymorphic Engagement & Subquery Acceleration Indexes
CREATE INDEX IF NOT EXISTS idx_reactions_user_question ON public.reactions (user_id, question_id) WHERE question_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reactions_user_answer ON public.reactions (user_id, answer_id) WHERE answer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reactions_user_post ON public.reactions (user_id, post_id) WHERE post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_question ON public.bookmarks (user_id, question_id) WHERE question_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_post ON public.bookmarks (user_id, post_id) WHERE post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_question ON public.comments (question_id, created_at ASC) WHERE question_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_comments_answer ON public.comments (answer_id, created_at ASC) WHERE answer_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments (post_id, created_at ASC) WHERE post_id IS NOT NULL AND deleted_at IS NULL;

-- E. Operational, Security & Notification Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(recipient_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reports_status_created ON public.reports(status, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_blocks_lookup ON public.blocks(blocker_id, blocked_id);
CREATE INDEX IF NOT EXISTS idx_community_members_lookup ON public.community_members (community_id, user_id, role);


-- ============================================================
-- 5. SECURITY HELPER FUNCTIONS
-- ============================================================

-- Check if user is system admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE PARALLEL SAFE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = (select auth.uid()) AND system_role = 'admin'
    );
$$;

-- Check if user is system moderator or admin
CREATE OR REPLACE FUNCTION public.is_moderator()
RETURNS BOOLEAN LANGUAGE sql STABLE PARALLEL SAFE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = (select auth.uid()) AND system_role IN ('moderator', 'admin')
    );
$$;

-- Check if current authenticated user has blocked target_user_id or vice versa
CREATE OR REPLACE FUNCTION public.is_blocked(target_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE PARALLEL SAFE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.blocks
        WHERE (blocker_id = (select auth.uid()) AND blocked_id = target_user_id)
           OR (blocker_id = target_user_id AND blocked_id = (select auth.uid()))
    );
$$;

-- Check if user is moderator of a specific community
CREATE OR REPLACE FUNCTION public.is_community_mod(target_community_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE PARALLEL SAFE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.community_members
        WHERE community_id = target_community_id 
          AND user_id = (select auth.uid()) 
          AND role IN ('moderator', 'admin')
    ) OR public.is_admin();
$$;


-- ============================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Profiles readable by anyone except blocked"
ON public.profiles FOR SELECT
USING (
    (select auth.uid()) IS NULL OR NOT EXISTS (
        SELECT 1 FROM public.blocks
        WHERE (blocker_id = (select auth.uid()) AND blocked_id = id)
           OR (blocker_id = id AND blocked_id = (select auth.uid()))
    )
);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING ((select auth.uid()) = id)
WITH CHECK ((select auth.uid()) = id);

-- 2. Universities & Topics (Public read)
CREATE POLICY "Universities are readable by all" ON public.universities FOR SELECT USING (true);
CREATE POLICY "Topics are readable by all" ON public.topics FOR SELECT USING (true);

-- 3. Education Policies
CREATE POLICY "Education readable by all except blocked"
ON public.education FOR SELECT
USING (
    (select auth.uid()) IS NULL OR NOT EXISTS (
        SELECT 1 FROM public.blocks
        WHERE (blocker_id = (select auth.uid()) AND blocked_id = user_id)
           OR (blocker_id = user_id AND blocked_id = (select auth.uid()))
    )
);

CREATE POLICY "Users insert own education" ON public.education FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users update own education" ON public.education FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users delete own education" ON public.education FOR DELETE USING ((select auth.uid()) = user_id);

-- 4. User Topics Policies
CREATE POLICY "User topics readable by all" ON public.user_topics FOR SELECT USING (true);
CREATE POLICY "Users insert own topics" ON public.user_topics FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users update own topics" ON public.user_topics FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users delete own topics" ON public.user_topics FOR DELETE USING ((select auth.uid()) = user_id);

-- 5. Communities Policies
CREATE POLICY "Communities readable by all" ON public.communities FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create communities" ON public.communities FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated' AND (select auth.uid()) = created_by);
CREATE POLICY "Community mods and admins can update community" ON public.communities FOR UPDATE USING (public.is_community_mod(id)) WITH CHECK (public.is_community_mod(id));

-- 6. Community Members Policies
CREATE POLICY "Community members readable by all" ON public.community_members FOR SELECT USING (true);
CREATE POLICY "Users insert own community membership" ON public.community_members FOR INSERT WITH CHECK ((select auth.uid()) = user_id AND role = 'member');
CREATE POLICY "Community mods update community membership" ON public.community_members FOR UPDATE USING (public.is_community_mod(community_id)) WITH CHECK (public.is_community_mod(community_id));
CREATE POLICY "Users delete own community membership" ON public.community_members FOR DELETE USING ((select auth.uid()) = user_id);

-- 7. Questions Policies
CREATE POLICY "Questions readable if not deleted and not blocked"
ON public.questions FOR SELECT
USING (
    deleted_at IS NULL AND (
        (select auth.uid()) IS NULL OR NOT EXISTS (
            SELECT 1 FROM public.blocks
            WHERE (blocker_id = (select auth.uid()) AND blocked_id = author_id)
               OR (blocker_id = author_id AND blocked_id = (select auth.uid()))
        )
    )
);

CREATE POLICY "Authenticated users create questions" ON public.questions FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated' AND (select auth.uid()) = author_id);
CREATE POLICY "Authors and mods update questions" ON public.questions FOR UPDATE USING ((select auth.uid()) = author_id OR (community_id IS NOT NULL AND public.is_community_mod(community_id)) OR public.is_admin()) WITH CHECK ((select auth.uid()) = author_id OR (community_id IS NOT NULL AND public.is_community_mod(community_id)) OR public.is_admin());

-- 8. Question Topics Policies
CREATE POLICY "Question topics readable by all" ON public.question_topics FOR SELECT USING (true);
CREATE POLICY "Question author inserts question topics" ON public.question_topics FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.questions WHERE id = question_id AND author_id = (select auth.uid())));
CREATE POLICY "Question author updates question topics" ON public.question_topics FOR UPDATE USING (EXISTS (SELECT 1 FROM public.questions WHERE id = question_id AND author_id = (select auth.uid()))) WITH CHECK (EXISTS (SELECT 1 FROM public.questions WHERE id = question_id AND author_id = (select auth.uid())));
CREATE POLICY "Question author deletes question topics" ON public.question_topics FOR DELETE USING (EXISTS (SELECT 1 FROM public.questions WHERE id = question_id AND author_id = (select auth.uid())));

-- 9. Answers Policies
CREATE POLICY "Answers readable if not deleted and not blocked"
ON public.answers FOR SELECT
USING (
    deleted_at IS NULL AND (
        (select auth.uid()) IS NULL OR NOT EXISTS (
            SELECT 1 FROM public.blocks
            WHERE (blocker_id = (select auth.uid()) AND blocked_id = author_id)
               OR (blocker_id = author_id AND blocked_id = (select auth.uid()))
        )
    )
);

CREATE POLICY "Authenticated users create answers" ON public.answers FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated' AND (select auth.uid()) = author_id);
CREATE POLICY "Authors and mods update answers" ON public.answers FOR UPDATE USING ((select auth.uid()) = author_id OR public.is_moderator()) WITH CHECK ((select auth.uid()) = author_id OR public.is_moderator());

-- 10. Posts Policies
CREATE POLICY "Posts readable if not deleted and not blocked"
ON public.posts FOR SELECT
USING (
    deleted_at IS NULL AND (
        (select auth.uid()) IS NULL OR NOT EXISTS (
            SELECT 1 FROM public.blocks
            WHERE (blocker_id = (select auth.uid()) AND blocked_id = author_id)
               OR (blocker_id = author_id AND blocked_id = (select auth.uid()))
        )
    )
);

CREATE POLICY "Authenticated users create posts" ON public.posts FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated' AND (select auth.uid()) = author_id);
CREATE POLICY "Authors and mods update posts" ON public.posts FOR UPDATE USING ((select auth.uid()) = author_id OR (community_id IS NOT NULL AND public.is_community_mod(community_id)) OR public.is_admin()) WITH CHECK ((select auth.uid()) = author_id OR (community_id IS NOT NULL AND public.is_community_mod(community_id)) OR public.is_admin());

-- 11. Comments Policies
CREATE POLICY "Comments readable if not deleted and not blocked"
ON public.comments FOR SELECT
USING (
    deleted_at IS NULL AND (
        (select auth.uid()) IS NULL OR NOT EXISTS (
            SELECT 1 FROM public.blocks
            WHERE (blocker_id = (select auth.uid()) AND blocked_id = author_id)
               OR (blocker_id = author_id AND blocked_id = (select auth.uid()))
        )
    )
);

CREATE POLICY "Authenticated users create comments" ON public.comments FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated' AND (select auth.uid()) = author_id);
CREATE POLICY "Authors and mods update comments" ON public.comments FOR UPDATE USING ((select auth.uid()) = author_id OR public.is_moderator()) WITH CHECK ((select auth.uid()) = author_id OR public.is_moderator());

-- 12. Reactions, Follows & Bookmarks
CREATE POLICY "Reactions readable by all" ON public.reactions FOR SELECT USING (true);
CREATE POLICY "Users insert own reactions" ON public.reactions FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users update own reactions" ON public.reactions FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users delete own reactions" ON public.reactions FOR DELETE USING ((select auth.uid()) = user_id);

CREATE POLICY "Follows readable by all" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users insert own follows" ON public.follows FOR INSERT WITH CHECK ((select auth.uid()) = follower_id);
CREATE POLICY "Users update own follows" ON public.follows FOR UPDATE USING ((select auth.uid()) = follower_id) WITH CHECK ((select auth.uid()) = follower_id);
CREATE POLICY "Users delete own follows" ON public.follows FOR DELETE USING ((select auth.uid()) = follower_id);

CREATE POLICY "Bookmarks private to user" ON public.bookmarks FOR ALL USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- 13. Notifications, Push Tokens & Blocks
CREATE POLICY "Notifications private to recipient" ON public.notifications FOR ALL USING ((select auth.uid()) = recipient_id) WITH CHECK ((select auth.uid()) = recipient_id);
CREATE POLICY "Push tokens private to user" ON public.push_tokens FOR ALL USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Blocks private to blocker" ON public.blocks FOR ALL USING ((select auth.uid()) = blocker_id) WITH CHECK ((select auth.uid()) = blocker_id);

-- 14. Reports & Verification
CREATE POLICY "Authenticated users can submit reports" ON public.reports FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated' AND (select auth.uid()) = reporter_id);
CREATE POLICY "Reports readable by moderators" ON public.reports FOR SELECT USING (public.is_moderator());
CREATE POLICY "Reports updatable by moderators" ON public.reports FOR UPDATE USING (public.is_moderator()) WITH CHECK (public.is_moderator());
CREATE POLICY "Reports deletable by moderators" ON public.reports FOR DELETE USING (public.is_moderator());

CREATE POLICY "Users can manage own verification requests" ON public.verification_requests FOR ALL USING ((select auth.uid()) = user_id OR public.is_admin()) WITH CHECK ((select auth.uid()) = user_id OR public.is_admin());
CREATE POLICY "Audit logs viewable only by admins and moderators" ON public.moderation_audit_logs FOR SELECT USING (public.is_moderator());


-- ============================================================
-- 7. SECURITY & INTEGRITY TRIGGERS
-- ============================================================

-- 1. Updated At Timestamp Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_questions_updated_at ON public.questions;
CREATE TRIGGER tr_questions_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_answers_updated_at ON public.answers;
CREATE TRIGGER tr_answers_updated_at BEFORE UPDATE ON public.answers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_posts_updated_at ON public.posts;
CREATE TRIGGER tr_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_comments_updated_at ON public.comments;
CREATE TRIGGER tr_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. Auth Profile Creation Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_raw_username TEXT;
    v_clean_username TEXT;
    v_display_name TEXT;
BEGIN
    v_raw_username := COALESCE(
        NEW.raw_user_meta_data->>'username',
        split_part(NEW.email, '@', 1),
        'student_' || substr(NEW.id::text, 1, 8)
    );
    v_clean_username := regexp_replace(lower(v_raw_username), '[^a-z0-9_]', '_', 'g');
    v_display_name := COALESCE(
        NEW.raw_user_meta_data->>'display_name',
        NEW.raw_user_meta_data->>'full_name',
        v_raw_username
    );

    INSERT INTO public.profiles (id, username, display_name, created_at, updated_at)
    VALUES (NEW.id, v_clean_username, v_display_name, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Profile Sensitive Fields Protection Trigger (SEC-01)
CREATE OR REPLACE FUNCTION public.protect_sensitive_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF (select auth.role()) = 'authenticated' AND NOT public.is_admin() THEN
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

DROP TRIGGER IF EXISTS tr_protect_sensitive_profile_fields ON public.profiles;
CREATE TRIGGER tr_protect_sensitive_profile_fields
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_sensitive_profile_fields();

-- 4. Question Resolution Integrity Guard Trigger (SEC-04)
CREATE OR REPLACE FUNCTION public.protect_question_resolution_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.accepted_answer_id IS NOT NULL AND NEW.accepted_answer_id IS DISTINCT FROM OLD.accepted_answer_id THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.answers 
            WHERE id = NEW.accepted_answer_id 
              AND question_id = NEW.id 
              AND deleted_at IS NULL
        ) THEN
            RAISE EXCEPTION 'Invalid accepted_answer_id: answer does not exist or does not belong to this question' USING ERRCODE = 'P0002';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_protect_question_resolution ON public.questions;
CREATE TRIGGER tr_protect_question_resolution
    BEFORE UPDATE ON public.questions
    FOR EACH ROW EXECUTE FUNCTION public.protect_question_resolution_fields();

-- 5. Counter Synchronization Triggers
CREATE OR REPLACE FUNCTION public.sync_question_answer_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.questions SET answer_count = answer_count + 1 WHERE id = NEW.question_id;

        INSERT INTO public.notifications (recipient_id, actor_id, type, entity_type, entity_id)
        SELECT author_id, NEW.author_id, 'answer_created', 'question', NEW.question_id
        FROM public.questions 
        WHERE id = NEW.question_id AND author_id != NEW.author_id AND author_id IS NOT NULL;

        RETURN NEW;
    ELSIF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)) THEN
        UPDATE public.questions SET answer_count = GREATEST(0, answer_count - 1) WHERE id = OLD.question_id;
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_sync_answer_count ON public.answers;
CREATE TRIGGER tr_sync_answer_count
    AFTER INSERT OR DELETE OR UPDATE OF deleted_at ON public.answers
    FOR EACH ROW EXECUTE FUNCTION public.sync_question_answer_count();

CREATE OR REPLACE FUNCTION public.sync_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF NEW.post_id IS NOT NULL THEN
            UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
        ELSIF NEW.answer_id IS NOT NULL THEN
            UPDATE public.answers SET comment_count = comment_count + 1 WHERE id = NEW.answer_id;
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)) THEN
        IF OLD.post_id IS NOT NULL THEN
            UPDATE public.posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.post_id;
        ELSIF OLD.answer_id IS NOT NULL THEN
            UPDATE public.answers SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.answer_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_sync_comment_count ON public.comments;
CREATE TRIGGER tr_sync_comment_count
    AFTER INSERT OR DELETE OR UPDATE OF deleted_at ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.sync_comment_count();

CREATE OR REPLACE FUNCTION public.sync_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.communities SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.community_id;
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_sync_community_member_count ON public.community_members;
CREATE TRIGGER tr_sync_community_member_count
    AFTER INSERT OR DELETE ON public.community_members
    FOR EACH ROW EXECUTE FUNCTION public.sync_community_member_count();

CREATE OR REPLACE FUNCTION public.sync_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF NEW.reaction_type = 'helpful' THEN
            IF NEW.question_id IS NOT NULL THEN
                UPDATE public.questions SET helpful_count = helpful_count + 1 WHERE id = NEW.question_id;
            ELSIF NEW.answer_id IS NOT NULL THEN
                UPDATE public.answers SET helpful_count = helpful_count + 1 WHERE id = NEW.answer_id;
            ELSIF NEW.post_id IS NOT NULL THEN
                UPDATE public.posts SET helpful_count = helpful_count + 1 WHERE id = NEW.post_id;
            END IF;
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.reaction_type = 'helpful' THEN
            IF OLD.question_id IS NOT NULL THEN
                UPDATE public.questions SET helpful_count = GREATEST(0, helpful_count - 1) WHERE id = OLD.question_id;
            ELSIF OLD.answer_id IS NOT NULL THEN
                UPDATE public.answers SET helpful_count = GREATEST(0, helpful_count - 1) WHERE id = OLD.answer_id;
            ELSIF OLD.post_id IS NOT NULL THEN
                UPDATE public.posts SET helpful_count = GREATEST(0, helpful_count - 1) WHERE id = OLD.post_id;
            END IF;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_sync_reaction_counts ON public.reactions;
CREATE TRIGGER tr_sync_reaction_counts
    AFTER INSERT OR DELETE ON public.reactions
    FOR EACH ROW EXECUTE FUNCTION public.sync_reaction_counts();


-- ============================================================
-- 8. TRANSACTIONAL STORED PROCEDURES (RPCs)
-- ============================================================

-- 1. Accept Answer RPC
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

    SELECT author_id INTO v_answer_author_id 
    FROM public.answers 
    WHERE id = p_answer_id AND question_id = p_question_id AND deleted_at IS NULL;
    
    IF v_answer_author_id IS NULL THEN
        RAISE EXCEPTION 'Answer not found for this question' USING ERRCODE = 'P0002';
    END IF;

    IF v_prev_accepted_id IS NOT NULL AND v_prev_accepted_id != p_answer_id THEN
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

-- 2. Unaccept Answer RPC
CREATE OR REPLACE FUNCTION public.unaccept_answer(p_question_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_author_id UUID;
    v_prev_accepted_id UUID;
    v_prev_author_id UUID;
BEGIN
    SELECT author_id, accepted_answer_id INTO v_author_id, v_prev_accepted_id 
    FROM public.questions 
    WHERE id = p_question_id AND deleted_at IS NULL;

    IF v_author_id IS NULL OR v_author_id != (select auth.uid()) THEN
        RAISE EXCEPTION 'Only the question author can unaccept an answer' USING ERRCODE = '42501';
    END IF;

    IF v_prev_accepted_id IS NOT NULL THEN
        SELECT author_id INTO v_prev_author_id FROM public.answers WHERE id = v_prev_accepted_id;
        UPDATE public.answers SET is_accepted = FALSE WHERE id = v_prev_accepted_id;
        IF v_prev_author_id IS NOT NULL THEN
            UPDATE public.profiles SET reputation_score = GREATEST(0, reputation_score - 15) WHERE id = v_prev_author_id;
        END IF;
    END IF;

    UPDATE public.questions 
    SET accepted_answer_id = NULL,
        status = 'open',
        solved_at = NULL,
        updated_at = NOW()
    WHERE id = p_question_id;
END;
$$;

-- 3. Toggle Reaction RPC
CREATE OR REPLACE FUNCTION public.toggle_reaction(
    p_target_type VARCHAR(20),
    p_target_id UUID,
    p_reaction_type reaction_type_enum DEFAULT 'helpful'
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_deleted_id UUID;
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
        ON CONFLICT DO NOTHING;
        v_is_active := TRUE;
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

-- 4. Complete Onboarding RPC
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

    INSERT INTO public.profiles (id, username, display_name, country_code, current_status, updated_at)
    VALUES (v_user_id, p_username, p_display_name, p_country_code, p_current_status, NOW())
    ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        display_name = EXCLUDED.display_name,
        country_code = EXCLUDED.country_code,
        current_status = EXCLUDED.current_status,
        updated_at = NOW();

    INSERT INTO public.education (user_id, institution_name, degree, field, start_year, end_year, education_status)
    VALUES (v_user_id, p_institution_name, p_degree, p_field, p_start_year, p_end_year, p_current_status);

    IF array_length(p_topic_ids, 1) > 0 THEN
        FOREACH v_topic_id IN ARRAY p_topic_ids LOOP
            INSERT INTO public.user_topics (user_id, topic_id)
            VALUES (v_user_id, v_topic_id)
            ON CONFLICT (user_id, topic_id) DO NOTHING;
        END LOOP;
    END IF;
END;
$$;

-- 5. Execute Moderation Action RPC
CREATE OR REPLACE FUNCTION public.execute_moderation_action(
    p_report_id UUID,
    p_target_type VARCHAR(20),
    p_target_id UUID,
    p_action moderation_action_enum,
    p_reason TEXT,
    p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT public.is_moderator() THEN
        RAISE EXCEPTION 'Unauthorized: Moderator or Admin privileges required' USING ERRCODE = '42501';
    END IF;

    INSERT INTO public.moderation_audit_logs (
        moderator_id, 
        action, 
        post_id, 
        question_id, 
        answer_id, 
        comment_id, 
        profile_id, 
        reason, 
        metadata
    )
    VALUES (
        (select auth.uid()),
        p_action,
        CASE WHEN p_target_type = 'post' THEN p_target_id ELSE NULL END,
        CASE WHEN p_target_type = 'question' THEN p_target_id ELSE NULL END,
        CASE WHEN p_target_type = 'answer' THEN p_target_id ELSE NULL END,
        CASE WHEN p_target_type = 'comment' THEN p_target_id ELSE NULL END,
        CASE WHEN p_target_type = 'profile' THEN p_target_id ELSE NULL END,
        p_reason,
        p_metadata
    );

    IF p_action = 'content_removed' THEN
        IF p_target_type = 'question' THEN
            UPDATE public.questions SET deleted_at = NOW() WHERE id = p_target_id;
        ELSIF p_target_type = 'answer' THEN
            UPDATE public.answers SET deleted_at = NOW() WHERE id = p_target_id;
        ELSIF p_target_type = 'post' THEN
            UPDATE public.posts SET deleted_at = NOW() WHERE id = p_target_id;
        ELSIF p_target_type = 'comment' THEN
            UPDATE public.comments SET deleted_at = NOW() WHERE id = p_target_id;
        END IF;
    ELSIF p_action = 'user_banned' THEN
        IF p_target_type = 'profile' THEN
            UPDATE public.profiles SET deleted_at = NOW() WHERE id = p_target_id;
        END IF;
    END IF;

    IF p_report_id IS NOT NULL THEN
        UPDATE public.reports 
        SET status = 'resolved', reviewed_by = (select auth.uid()), reviewed_at = NOW() 
        WHERE id = p_report_id;
    END IF;
END;
$$;

-- 6. Create Question RPC
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
            VALUES (v_question_id, v_topic_id)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    RETURN v_question_id;
END;
$$;

-- 7. Create Community RPC (Atomic Creation + Admin Membership)
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
        1
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

-- 8. Get User Bookmarks RPC
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

-- 9. Delete Own Account RPC (GDPR compliant)
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := (select auth.uid());
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
    END IF;

    DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;

-- 10. High-Speed Keyset-Paginated Home Feed RPC
CREATE OR REPLACE FUNCTION public.get_home_feed(
    p_filter TEXT DEFAULT 'all',
    p_limit INT DEFAULT 20,
    p_cursor_created_at TIMESTAMPTZ DEFAULT NULL,
    p_cursor_id UUID DEFAULT NULL
)
RETURNS TABLE (
    item_type TEXT,
    id UUID,
    author_id UUID,
    author_username CITEXT,
    author_display_name TEXT,
    author_avatar_path TEXT,
    author_status user_status_enum,
    author_is_verified BOOLEAN,
    title TEXT,
    body TEXT,
    status question_status_enum,
    answer_count INT,
    helpful_count INT,
    comment_count INT,
    image_paths TEXT[],
    created_at TIMESTAMPTZ,
    is_helpful BOOLEAN,
    is_bookmarked BOOLEAN
) LANGUAGE plpgsql STABLE PARALLEL SAFE SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_user_university_id UUID;
BEGIN
    IF p_filter = 'university' AND v_user_id IS NOT NULL THEN
        SELECT university_id INTO v_user_university_id 
        FROM public.education 
        WHERE user_id = v_user_id AND university_id IS NOT NULL 
        ORDER BY created_at DESC 
        LIMIT 1;
    END IF;

    RETURN QUERY
    WITH filtered_items AS (
        SELECT 
            'question'::TEXT AS item_type,
            q.id,
            q.author_id,
            COALESCE(p.username, 'scholar'::citext) AS author_username,
            COALESCE(p.display_name, 'Academic Scholar') AS author_display_name,
            p.avatar_path AS author_avatar_path,
            COALESCE(p.current_status, 'undergraduate'::user_status_enum) AS author_status,
            COALESCE(p.is_verified, false) AS author_is_verified,
            q.title,
            q.body,
            q.status,
            q.answer_count,
            q.helpful_count,
            0::INT AS comment_count,
            q.image_paths,
            q.created_at,
            EXISTS (
                SELECT 1 FROM public.reactions r 
                WHERE r.question_id = q.id 
                  AND r.user_id = v_user_id 
                  AND r.reaction_type = 'helpful'
            ) AS is_helpful,
            EXISTS (
                SELECT 1 FROM public.bookmarks b 
                WHERE b.question_id = q.id 
                  AND b.user_id = v_user_id
            ) AS is_bookmarked
        FROM public.questions q
        LEFT JOIN public.profiles p ON p.id = q.author_id
        WHERE q.deleted_at IS NULL
          AND (v_user_id IS NULL OR q.author_id IS NULL OR NOT public.is_blocked(q.author_id))
          AND (
              p_filter = 'all' OR
              (p_filter = 'unsolved' AND q.status = 'open') OR
              (p_filter = 'following' AND v_user_id IS NOT NULL AND q.author_id IS NOT NULL AND EXISTS (
                  SELECT 1 FROM public.follows f WHERE f.follower_id = v_user_id AND f.following_id = q.author_id
              )) OR
              (p_filter = 'university' AND v_user_university_id IS NOT NULL AND q.community_id IN (
                  SELECT c.id FROM public.communities c WHERE c.university_id = v_user_university_id
              ))
          )
          AND (
              p_cursor_created_at IS NULL OR 
              (q.created_at, q.id) < (p_cursor_created_at, p_cursor_id)
          )

        UNION ALL

        SELECT 
            'post'::TEXT AS item_type,
            pst.id,
            pst.author_id,
            COALESCE(p.username, 'scholar'::citext) AS author_username,
            COALESCE(p.display_name, 'Academic Scholar') AS author_display_name,
            p.avatar_path AS author_avatar_path,
            COALESCE(p.current_status, 'undergraduate'::user_status_enum) AS author_status,
            COALESCE(p.is_verified, false) AS author_is_verified,
            ''::TEXT AS title,
            pst.body,
            'open'::question_status_enum AS status,
            0::INT AS answer_count,
            pst.helpful_count,
            pst.comment_count,
            pst.image_paths,
            pst.created_at,
            EXISTS (
                SELECT 1 FROM public.reactions r 
                WHERE r.post_id = pst.id 
                  AND r.user_id = v_user_id 
                  AND r.reaction_type = 'helpful'
            ) AS is_helpful,
            EXISTS (
                SELECT 1 FROM public.bookmarks b 
                WHERE b.post_id = pst.id 
                  AND b.user_id = v_user_id
            ) AS is_bookmarked
        FROM public.posts pst
        LEFT JOIN public.profiles p ON p.id = pst.author_id
        WHERE pst.deleted_at IS NULL
          AND pst.visibility = 'public'
          AND (v_user_id IS NULL OR pst.author_id IS NULL OR NOT public.is_blocked(pst.author_id))
          AND (
              p_filter = 'all' OR
              (p_filter = 'following' AND v_user_id IS NOT NULL AND pst.author_id IS NOT NULL AND EXISTS (
                  SELECT 1 FROM public.follows f WHERE f.follower_id = v_user_id AND f.following_id = pst.author_id
              )) OR
              (p_filter = 'university' AND v_user_university_id IS NOT NULL AND pst.community_id IN (
                  SELECT c.id FROM public.communities c WHERE c.university_id = v_user_university_id
              ))
          )
          AND (
              p_cursor_created_at IS NULL OR 
              (pst.created_at, pst.id) < (p_cursor_created_at, p_cursor_id)
          )
    )
    SELECT * FROM filtered_items
    ORDER BY created_at DESC, id DESC
    LIMIT p_limit;
END;
$$;

-- 11. Ranked Full-Text Search RPC
CREATE OR REPLACE FUNCTION public.search_questions_fts(
    p_query TEXT,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    body TEXT,
    status question_status_enum,
    answer_count INT,
    helpful_count INT,
    created_at TIMESTAMPTZ,
    rank REAL
) LANGUAGE plpgsql STABLE PARALLEL SAFE SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_tsquery TSQUERY;
    v_user_id UUID := auth.uid();
BEGIN
    v_tsquery := plainto_tsquery('english', p_query);
    
    RETURN QUERY
    SELECT 
        q.id,
        q.title,
        q.body,
        q.status,
        q.answer_count,
        q.helpful_count,
        q.created_at,
        ts_rank_cd(q.fts, v_tsquery) AS rank
    FROM public.questions q
    WHERE q.deleted_at IS NULL
      AND (v_user_id IS NULL OR q.author_id IS NULL OR NOT public.is_blocked(q.author_id))
      AND (q.fts @@ v_tsquery OR q.title ILIKE '%' || p_query || '%')
    ORDER BY rank DESC, q.created_at DESC
    LIMIT p_limit;
END;
$$;


-- ============================================================
-- 9. STORAGE BUCKETS & POLICIES
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('avatars', 'avatars', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
    ('attachments', 'attachments', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Avatars Policies
DROP POLICY IF EXISTS "Public read for avatars" ON storage.objects;
CREATE POLICY "Public read for avatars" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated users can upload own avatar" ON storage.objects;
CREATE POLICY "Authenticated users can upload own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid())::text);

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid())::text);

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid())::text);

-- Attachments Policies
DROP POLICY IF EXISTS "Public read for attachments" ON storage.objects;
CREATE POLICY "Public read for attachments" ON storage.objects FOR SELECT TO public USING (bucket_id = 'attachments');

DROP POLICY IF EXISTS "Authenticated users can upload attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload attachments" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'attachments' AND (storage.foldername(name))[1] = (select auth.uid())::text);

DROP POLICY IF EXISTS "Users can delete own attachments" ON storage.objects;
CREATE POLICY "Users can delete own attachments" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'attachments' AND (storage.foldername(name))[1] = (select auth.uid())::text);


-- ============================================================
-- 10. REALTIME & REPLICA IDENTITY
-- ============================================================
ALTER TABLE public.questions REPLICA IDENTITY FULL;
ALTER TABLE public.answers REPLICA IDENTITY FULL;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.questions;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.answers;
EXCEPTION WHEN others THEN NULL; END $$;

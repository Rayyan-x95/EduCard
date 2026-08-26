-- ============================================================================
-- Migration: 20260830000000_p0_education_idempotence.sql
-- Description: Fix P0 education duplication — re-running complete_onboarding
--              (cold-start fallback race) inserted a second education row for
--              the same user/degree. Add a uniqueness guard and make the RPC
--              idempotent.
--
-- Fixes:
--   P0-018  duplicate education rows on onboarding retry
--   P0-023  RPC bypass after already-onboarded
-- ============================================================================

-- 1. Deduplicate legacy duplicates before adding constraint.
--    Keep the earliest row per (user_id, institution_name, degree, start_year)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.education
        GROUP BY user_id, institution_name, degree, start_year
        HAVING COUNT(*) > 1
    ) THEN
        DELETE FROM public.education
        WHERE id IN (
            SELECT id FROM (
                SELECT id,
                       ROW_NUMBER() OVER (
                           PARTITION BY user_id, institution_name, degree, start_year
                           ORDER BY created_at ASC
                       ) AS rn
                FROM public.education
            ) ranked
            WHERE rn > 1
        );
    END IF;
END $$;

-- 2. Unique guard — one education entry per user/institution/degree/start_year
CREATE UNIQUE INDEX IF NOT EXISTS uq_education_user_primary
ON public.education (user_id, institution_name, degree, start_year);

-- 3. Make complete_onboarding idempotent:
--    - If onboarding_completed already TRUE, ignore education insert (ON CONFLICT DO NOTHING)
--    - Otherwise proceed as before.
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
    v_already_onboarded BOOLEAN;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
    END IF;

    SELECT onboarding_completed INTO v_already_onboarded
    FROM public.profiles WHERE id = v_user_id;

    INSERT INTO public.profiles (id, username, display_name, country_code, current_status, onboarding_completed, updated_at)
    VALUES (v_user_id, p_username, p_display_name, p_country_code, p_current_status, TRUE, NOW())
    ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        display_name = EXCLUDED.display_name,
        country_code = EXCLUDED.country_code,
        current_status = EXCLUDED.current_status,
        onboarding_completed = TRUE,
        updated_at = NOW();

    -- Only insert education if this is the first onboarding.
    -- Re-entries (fallback race) must not create duplicates.
    IF v_already_onboarded IS DISTINCT FROM TRUE THEN
        INSERT INTO public.education (user_id, institution_name, degree, field, start_year, end_year, education_status)
        VALUES (v_user_id, p_institution_name, p_degree, p_field, p_start_year, p_end_year, p_current_status)
        ON CONFLICT (user_id, institution_name, degree, start_year) DO NOTHING;
    END IF;

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

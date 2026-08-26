-- ============================================================================
-- Migration: 20260905000000_production_hardening.sql
-- Description: Production-hardening fixes.
--
-- Fixes:
--   PROD-01  Signup failure on username collision. handle_new_user derived
--            profiles.username from raw_user_meta_data or the email prefix
--            and inserted it against the UNIQUE(username) constraint with no
--            collision handling. Two users signing up as "john.doe@x.com"
--            made the second auth.users INSERT fail with 23505 raised from
--            the trigger — i.e. an unhandled signup failure caused purely by
--            naming coincidence. The function now:
--              - falls back to an id-derived username when the cleaned value
--                is empty or all-underscores (e.g. non-Latin email prefixes),
--              - retries with a deterministic, length-growing id-derived
--                suffix on username collisions instead of aborting signup.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_raw_username TEXT;
    v_clean_username TEXT;
    v_display_name TEXT;
    v_username TEXT;
    v_suffix_len INT := 8;
    v_attempts INT := 0;
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

    -- A cleaned value that is empty or all underscores (e.g. non-Latin email
    -- prefixes) would collide instantly; derive a stable fallback instead.
    IF v_clean_username IS NULL OR v_clean_username = '' OR v_clean_username !~ '[a-z0-9]' THEN
        v_clean_username := 'student_' || substr(NEW.id::text, 1, 8);
    END IF;

    v_username := v_clean_username;
    LOOP
        BEGIN
            INSERT INTO public.profiles (id, username, display_name, created_at, updated_at)
            VALUES (NEW.id, v_username, v_display_name, NOW(), NOW())
            ON CONFLICT (id) DO NOTHING;

            EXIT;
        EXCEPTION WHEN unique_violation THEN
            -- The id conflict path is absorbed by ON CONFLICT (id); reaching
            -- this handler means the USERNAME was taken by another account.
            -- Disambiguate deterministically from the auth user's own id so
            -- signup never fails due to naming coincidence alone.
            v_attempts := v_attempts + 1;
            IF v_attempts > 3 THEN
                RAISE EXCEPTION 'Could not allocate a unique username' USING ERRCODE = '23505';
            END IF;
            v_username := v_clean_username || '_' || substr(NEW.id::text, 1, LEAST(v_suffix_len, 32));
            v_suffix_len := v_suffix_len * 2;
        END;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

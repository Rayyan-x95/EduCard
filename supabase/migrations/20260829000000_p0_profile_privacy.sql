-- ============================================================================
-- Migration: 20260829000000_p0_profile_privacy.sql
-- Description: Fix P0 privacy lie — is_public_profile was stored but never
--              enforced in RLS. Private profiles must be invisible to anon
--              and non-moderator third parties while remaining visible to
--              their owner and to moderators/admins.
--
-- Fixes:
--   P0-016  is_public_profile column unused for enforcement
--   P1-03   redundant wrapper (keep for audit trace)
-- ============================================================================

-- Replace the profiles SELECT policy with one that respects is_public_profile
DROP POLICY IF EXISTS "Profiles readable by anyone except blocked" ON public.profiles;

CREATE POLICY "Profiles readable by anyone except blocked"
ON public.profiles FOR SELECT
USING (
    deleted_at IS NULL
    AND (
        is_public_profile = TRUE
        OR (select auth.uid()) = id
        OR public.is_moderator()
    )
    AND (
        (select auth.uid()) IS NULL OR NOT EXISTS (
            SELECT 1 FROM public.blocks
            WHERE (blocker_id = (select auth.uid()) AND blocked_id = id)
               OR (blocker_id = id AND blocked_id = (select auth.uid()))
        )
    )
);

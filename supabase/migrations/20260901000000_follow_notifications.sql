-- ============================================================================
-- Migration: 20260901000000_follow_notifications.sql
-- Description: Wire the dormant 'follow' notification type. The notifications
--              CHECK constraint already allows type='follow' but nothing ever
--              created one, so follows were socially silent.
-- Fixes:
--   FINDING-05  Follow never notifies
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_follow_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    -- Only notify on new follows (INSERT). Unfollows are silent.
    INSERT INTO public.notifications (recipient_id, actor_id, type, entity_type, entity_id)
    VALUES (
        NEW.following_id,
        NEW.follower_id,
        'follow',
        'profile',
        NEW.follower_id
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_follow_notification ON public.follows;
CREATE TRIGGER tr_follow_notification
    AFTER INSERT ON public.follows
    FOR EACH ROW EXECUTE FUNCTION public.sync_follow_notification();

-- ---------------------------------------------------------------------------
-- Push copy for the new type (send-push compose() handles known types; add
-- follow there too so the sweep doesn't fall through to the generic branch).
-- This is a documentation anchor: the Deno function lives in
-- supabase/functions/send-push/index.ts and must be redeployed after edit.
-- ---------------------------------------------------------------------------
COMMENT ON TRIGGER tr_follow_notification ON public.follows IS
'Creates a type=follow notification for the followed user. Pair with the "follow" case in send-push compose().';

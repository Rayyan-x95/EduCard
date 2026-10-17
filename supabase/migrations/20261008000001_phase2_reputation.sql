-- Phase 2: Reputation Events Ledger
-- Resolves uncontrolled reputation modification by instituting an append-only ledger for all reputation changes.

CREATE TABLE IF NOT EXISTS public.reputation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    score_delta INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- RLS for reputation_events
ALTER TABLE public.reputation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reputation events"
ON public.reputation_events FOR SELECT
USING ((select auth.uid()) = user_id);

-- Only admins/service_role can insert/update/delete (handled inherently by lack of policies)
-- The SECURITY DEFINER functions will bypass RLS to insert into this table.

-- Function to handle profile reputation updates safely
CREATE OR REPLACE FUNCTION public.update_profile_reputation()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles 
    SET reputation_score = GREATEST(0, reputation_score + NEW.score_delta)
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Trigger to keep profiles in sync
DROP TRIGGER IF EXISTS on_reputation_event_inserted ON public.reputation_events;
CREATE TRIGGER on_reputation_event_inserted
AFTER INSERT ON public.reputation_events
FOR EACH ROW EXECUTE FUNCTION public.update_profile_reputation();

-- Update accept_answer to use the ledger
CREATE OR REPLACE FUNCTION public.accept_answer(p_question_id UUID, p_answer_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_author_id UUID;
    v_answer_author_id UUID;
    v_prev_accepted_id UUID;
    v_prev_author_id UUID;
    v_prev_is_accepted BOOLEAN;
    v_is_already_accepted BOOLEAN;
BEGIN
    SELECT author_id, accepted_answer_id INTO v_author_id, v_prev_accepted_id 
    FROM public.questions 
    WHERE id = p_question_id AND deleted_at IS NULL
    FOR UPDATE;

    IF v_author_id IS NULL OR v_author_id != auth.uid() THEN
        RAISE EXCEPTION 'Only the question author can accept an answer' USING ERRCODE = '42501';
    END IF;

    SELECT author_id, is_accepted INTO v_answer_author_id, v_is_already_accepted 
    FROM public.answers 
    WHERE id = p_answer_id AND question_id = p_question_id AND deleted_at IS NULL
    FOR UPDATE;

    IF v_answer_author_id IS NULL THEN
        RAISE EXCEPTION 'Invalid answer' USING ERRCODE = '42501';
    END IF;

    IF v_answer_author_id = v_author_id THEN
        RAISE EXCEPTION 'Question authors cannot accept their own answer' USING ERRCODE = '42501';
    END IF;

    -- If another answer was previously accepted, unaccept it and revoke reputation
    IF v_prev_accepted_id IS NOT NULL AND v_prev_accepted_id != p_answer_id THEN
        SELECT author_id, is_accepted INTO v_prev_author_id, v_prev_is_accepted 
        FROM public.answers 
        WHERE id = v_prev_accepted_id
        FOR UPDATE;
        
        IF v_prev_is_accepted THEN
            UPDATE public.answers SET is_accepted = FALSE, updated_at = NOW() WHERE id = v_prev_accepted_id;
            
            -- Revoke reputation via ledger
            IF v_prev_author_id IS NOT NULL THEN
                INSERT INTO public.reputation_events (user_id, event_type, entity_type, entity_id, score_delta)
                VALUES (v_prev_author_id, 'answer_unaccepted', 'answer', v_prev_accepted_id, -15);
            END IF;
        END IF;
    END IF;

    -- If this answer is already accepted, nothing to change
    IF v_prev_accepted_id = p_answer_id AND v_is_already_accepted THEN
        RETURN;
    END IF;

    IF NOT v_is_already_accepted THEN
        UPDATE public.answers SET is_accepted = TRUE, updated_at = NOW() WHERE id = p_answer_id;

        UPDATE public.questions 
        SET accepted_answer_id = p_answer_id,
            status = 'solved',
            solved_at = NOW(),
            updated_at = NOW()
        WHERE id = p_question_id;

        -- Award reputation via ledger
        INSERT INTO public.reputation_events (user_id, event_type, entity_type, entity_id, score_delta)
        VALUES (v_answer_author_id, 'answer_accepted', 'answer', p_answer_id, 15);

        IF v_answer_author_id != auth.uid() THEN
            INSERT INTO public.notifications (recipient_id, actor_id, type, entity_type, entity_id)
            VALUES (v_answer_author_id, auth.uid(), 'answer_accepted', 'question', p_question_id);
        END IF;
    END IF;
END;
$$;

-- Update unaccept_answer to use the ledger
CREATE OR REPLACE FUNCTION public.unaccept_answer(p_question_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_author_id UUID;
    v_prev_accepted_id UUID;
    v_prev_author_id UUID;
    v_prev_is_accepted BOOLEAN;
BEGIN
    SELECT author_id, accepted_answer_id INTO v_author_id, v_prev_accepted_id 
    FROM public.questions 
    WHERE id = p_question_id AND deleted_at IS NULL
    FOR UPDATE;

    IF v_author_id IS NULL OR v_author_id != auth.uid() THEN
        RAISE EXCEPTION 'Only the question author can unaccept an answer' USING ERRCODE = '42501';
    END IF;

    IF v_prev_accepted_id IS NOT NULL THEN
        SELECT author_id, is_accepted INTO v_prev_author_id, v_prev_is_accepted 
        FROM public.answers 
        WHERE id = v_prev_accepted_id
        FOR UPDATE;
        
        IF v_prev_is_accepted THEN
            UPDATE public.answers SET is_accepted = FALSE, updated_at = NOW() WHERE id = v_prev_accepted_id;
            
            -- Revoke reputation via ledger
            IF v_prev_author_id IS NOT NULL THEN
                INSERT INTO public.reputation_events (user_id, event_type, entity_type, entity_id, score_delta)
                VALUES (v_prev_author_id, 'answer_unaccepted', 'answer', v_prev_accepted_id, -15);
            END IF;
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

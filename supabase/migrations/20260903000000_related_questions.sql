-- ============================================================================
-- Migration: 20260903000000_related_questions.sql
-- Description: "Students also asked" — deterministic, explainable related-
--              question lookup via shared topic overlap.
--
-- DESIGN NOTES:
--   * Deliberately NOT a recommendation engine. Shared-topic count is the
--     ranking signal; recency breaks ties. Every result is explainable
--     ("shares 2 topics") which matches the V1 product ethos.
--   * Respects visibility: excludes deleted rows and soft-banned authors'
--     content via the same predicates the RLS policies use (the RPC is
--     SECURITY DEFINER so it must re-apply the predicates explicitly).
--   * Excludes blocked relationships for authenticated callers.
--   * Uses the existing idx_question_topics_topic index; LIMIT 4 keeps the
--     overlap join cheap.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_related_questions(
    p_question_id UUID,
    p_limit INT DEFAULT 4
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    status question_status_enum,
    answer_count INT,
    helpful_count INT,
    created_at TIMESTAMPTZ,
    shared_topics BIGINT
)
LANGUAGE sql STABLE PARALLEL SAFE SECURITY DEFINER SET search_path = public AS $$
    SELECT
        q.id,
        q.title,
        q.status,
        q.answer_count,
        q.helpful_count,
        q.created_at,
        COUNT(*)::BIGINT AS shared_topics
    FROM public.question_topics qt_source
    JOIN public.question_topics qt_other
        ON qt_other.topic_id = qt_source.topic_id
    JOIN public.questions q
        ON q.id = qt_other.question_id
    LEFT JOIN public.profiles p ON p.id = q.author_id
    WHERE qt_source.question_id = p_question_id
      AND q.id != p_question_id
      AND q.deleted_at IS NULL
      -- Soft-banned authors' content stays hidden, mirroring RLS:
      AND (q.author_id IS NULL OR p.deleted_at IS NULL)
      -- Blocked-pair exclusion for authenticated callers:
      AND (
          (select auth.uid()) IS NULL
          OR q.author_id IS NULL
          OR NOT EXISTS (
              SELECT 1 FROM public.blocks b
              WHERE (b.blocker_id = (select auth.uid()) AND b.blocked_id = q.author_id)
                 OR (b.blocker_id = q.author_id AND b.blocked_id = (select auth.uid()))
          )
      )
    GROUP BY q.id, q.title, q.status, q.answer_count, q.helpful_count, q.created_at
    ORDER BY shared_topics DESC, q.created_at DESC
    LIMIT GREATEST(1, LEAST(p_limit, 8));
$$;

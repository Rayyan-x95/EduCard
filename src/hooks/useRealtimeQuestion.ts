import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-client";
import { Telemetry } from "@/lib/telemetry";

/**
 * Hook to subscribe to realtime changes on a specific question and its answers.
 * Automatically invalidates queryClient caches upon updates (e.g. verified solution, new answers).
 *
 * Failure behavior: realtime loss degrades to pull-to-refresh / mutation
 * invalidations; failures are reported to telemetry, never thrown.
 */
export function useRealtimeQuestion(questionId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!questionId) return;

    const channel = supabase
      .channel(`realtime:question:${questionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "questions",
          filter: `id=eq.${questionId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.question(questionId) });
          queryClient.invalidateQueries({ queryKey: ["feed"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "answers",
          filter: `question_id=eq.${questionId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.answers(questionId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.question(questionId) });
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          Telemetry.addBreadcrumb("realtime", "question channel failure", {
            status,
            questionId,
          }, "error");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [questionId, queryClient]);
}

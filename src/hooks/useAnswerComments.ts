import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PostsService } from "@/services/posts";
import { queryKeys } from "@/lib/query-client";
import { AppHaptics } from "@/lib/haptics";

export function useAnswerComments(
  answerId: string,
  questionId: string,
  enabled: boolean
) {
  const queryClient = useQueryClient();

  const { data: comments = [], refetch } = useQuery({
    queryKey: queryKeys.answerComments(answerId),
    queryFn: () => PostsService.listAnswerComments(answerId),
    enabled,
  });

  const commentMutation = useMutation({
    mutationFn: (bodyText: string) =>
      PostsService.createComment({ answerId, body: bodyText.trim() }),
    onSuccess: () => {
      AppHaptics.success();
      refetch();
      queryClient.invalidateQueries({ queryKey: queryKeys.answers(questionId) });
    },
    onError: () => {
      AppHaptics.error();
    },
  });

  return {
    comments,
    refetch,
    submitComment: commentMutation.mutateAsync,
    isSubmitting: commentMutation.isPending,
  };
}

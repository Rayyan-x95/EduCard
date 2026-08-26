import { useState } from "react";
import { Alert } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QuestionsService } from "@/services/questions";
import { BookmarksService } from "@/services/bookmarks";
import { queryKeys } from "@/lib/query-client";
import { normalizeError } from "@/lib/errors";
import { Analytics } from "@/lib/analytics";
import { useAuthStore } from "@/stores/authStore";
import { AppHaptics } from "@/lib/haptics";
import { useRealtimeQuestion } from "@/hooks/useRealtimeQuestion";

export function useQuestionDetail(questionId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [answerText, setAnswerText] = useState("");
  const [error, setError] = useState("");

  // Realtime subscription for question & answer updates
  useRealtimeQuestion(questionId);

  // Fetch Bookmark status
  const { data: isBookmarked = false } = useQuery({
    queryKey: queryKeys.isBookmarked("question", questionId || ""),
    queryFn: () => BookmarksService.isBookmarked("question", questionId || "", user?.id || ""),
    enabled: Boolean(questionId && user?.id),
  });

  // Bookmark Toggle Mutation
  const bookmarkMutation = useMutation({
    mutationFn: () => {
      if (!user?.id) throw Object.assign(new Error("Please sign in first."), { code: "APP_ERROR" });
      if (!questionId) throw Object.assign(new Error("Invalid question."), { code: "APP_ERROR" });
      return BookmarksService.toggleBookmark("question", questionId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.isBookmarked("question", questionId || "") });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks("question") });
    },
    onError: (err) => {
      Alert.alert("Bookmark Error", normalizeError(err).message);
    },
  });

  // Fetch Question details
  const { data: question, isLoading: qLoading, isError: qIsError, refetch } = useQuery({
    queryKey: queryKeys.question(questionId || ""),
    queryFn: () => QuestionsService.getQuestionById(questionId || ""),
    enabled: Boolean(questionId),
  });

  // Fetch Answers list
  const {
    data: answers = [],
    isLoading: aLoading,
    isError: aIsError,
    refetch: refetchAnswers,
  } = useQuery({
    queryKey: queryKeys.answers(questionId || ""),
    queryFn: () => QuestionsService.getAnswers(questionId || ""),
    enabled: Boolean(questionId),
  });

  // Create Answer Mutation
  const createAnswerMutation = useMutation({
    mutationFn: () => {
      if (!user?.id) throw Object.assign(new Error("Please sign in first."), { code: "APP_ERROR" });
      if (!questionId) throw Object.assign(new Error("Invalid question."), { code: "APP_ERROR" });
      return QuestionsService.createAnswer(questionId, answerText.trim());
    },
    onSuccess: () => {
      AppHaptics.success();
      setAnswerText("");
      setError("");
      Analytics.track("answer_created", { question_id: questionId });
      queryClient.invalidateQueries({ queryKey: queryKeys.answers(questionId || "") });
      queryClient.invalidateQueries({ queryKey: queryKeys.question(questionId || "") });
    },
    onError: (err) => {
      AppHaptics.error();
      setError(normalizeError(err).message);
    },
  });

  // Accept Answer RPC Mutation
  const acceptAnswerMutation = useMutation({
    mutationFn: (answerId: string) => {
      if (!questionId) throw Object.assign(new Error("Invalid question."), { code: "APP_ERROR" });
      return QuestionsService.acceptAnswer(questionId, answerId);
    },
    onSuccess: () => {
      AppHaptics.success();
      Analytics.track("answer_accepted", { question_id: questionId });
      queryClient.invalidateQueries({ queryKey: queryKeys.question(questionId || "") });
      queryClient.invalidateQueries({ queryKey: queryKeys.answers(questionId || "") });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      Alert.alert("Verified Solution", "Answer accepted! Contributor awarded 15 reputation points.");
    },
    onError: (err) => {
      AppHaptics.error();
      Alert.alert("Action Failed", normalizeError(err).message);
    },
  });

  // Helpful reaction toggle on answers (server returns authoritative state)
  const reactionMutation = useMutation({
    mutationFn: (targetId: string) =>
      QuestionsService.toggleReaction("answer", targetId),
    onSuccess: () => {
      AppHaptics.medium();
      Analytics.track("helpful_voted", { target_type: "answer", question_id: questionId });
      queryClient.invalidateQueries({ queryKey: queryKeys.answers(questionId || "") });
    },
    onError: (err) => {
      Alert.alert("Reaction Failed", normalizeError(err).message);
    },
  });

  return {
    question,
    answers,
    isBookmarked,
    qIsError,
    qRefetch: refetch,
    isLoading: qLoading || aLoading,
    qLoading,
    aLoading,
    aIsError,
    refetchAnswers,
    answerText,
    setAnswerText,
    error,
    setError,
    bookmarkMutation,
    createAnswerMutation,
    acceptAnswerMutation,
    reactionMutation,
  };
}

import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { ContributorBadge } from "./ContributorBadge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PostsService, PostComment } from "@/services/posts";
import { UserStatusEnum } from "@/types/database";
import { AppHaptics } from "@/lib/haptics";
import { normalizeError } from "@/lib/errors";
import {
  CheckCircle2,
  ThumbsUp,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";

export interface AnswerCardData {
  id: string;
  question_id: string;
  author_id: string | null;
  author_display_name: string;
  author_avatar_path: string | null;
  author_status: UserStatusEnum;
  author_is_verified: boolean;
  institution_name?: string | null;
  body: string;
  is_accepted: boolean;
  helpful_count: number;
  created_at: string;
  is_helpful?: boolean;
}

interface AnswerCardProps {
  answer: AnswerCardData;
  isQuestionAuthor?: boolean;
  onAcceptPress?: (id: string) => void;
  onHelpfulPress?: (id: string) => void;
  isAccepting?: boolean;
}

/**
 * Answer card with an expandable comment thread. Comments were previously
 * DB-supported (comments.answer_id) but unreachable — this completes the
 * workflow using the same pattern as question comments.
 */
export function AnswerCard({
  answer,
  isQuestionAuthor = false,
  onAcceptPress,
  onHelpfulPress,
  isAccepting = false,
}: AnswerCardProps) {
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  // Lazy: only fetched once expanded.
  const { data: comments = [], refetch } = useQuery({
    queryKey: ["answer-comments", answer.id],
    queryFn: () => PostsService.listAnswerComments(answer.id),
    enabled: showComments,
  });

  const commentMutation = useMutation({
    mutationFn: () =>
      PostsService.createComment({ answerId: answer.id, body: commentText.trim() }),
    onSuccess: () => {
      AppHaptics.success();
      setCommentText("");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["answers", answer.question_id] });
    },
    onError: () => {
      AppHaptics.error();
    },
  });

  return (
    <Card
      isSolved={answer.is_accepted}
      className={
        answer.is_accepted
          ? "bg-tertiary-container/15 border-tertiary/50 mb-5"
          : "bg-surface-container border-outline-variant/50 mb-5"
      }
    >
      {/* Verified Solution Banner for Accepted Answer */}
      {answer.is_accepted && (
        <View className="flex-row items-center space-x-2.5 bg-tertiary-container/40 border border-tertiary/40 rounded-xl px-3.5 py-2.5 mb-4">
          <CheckCircle2 size={16} color="#34D399" />
          <Typography variant="label-md" className="font-bold text-tertiary">
            Verified Solution by Question Author
          </Typography>
        </View>
      )}

      {/* Author Header with Role Ring & Contextual Metadata */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center space-x-3.5 flex-1 mr-3">
          <Avatar
            name={answer.author_display_name}
            uri={answer.author_avatar_path}
            size="md"
            role={answer.author_status}
            isVerified={answer.author_is_verified}
          />
          <View className="flex-1">
            <Typography variant="label-md" className="text-on-surface font-semibold" numberOfLines={1}>
              {answer.author_display_name}
            </Typography>
            <Typography variant="label-sm" className="text-on-surface-variant/70 mt-0.5 normal-case">
              {answer.institution_name ? answer.institution_name : "Academic Contributor"}
            </Typography>
          </View>
        </View>

        <ContributorBadge
          status={answer.author_status}
          isVerified={answer.author_is_verified}
        />
      </View>

      {/* Long-form Answer Body with Generous Line Height */}
      <Typography variant="body-lg" className="text-on-surface leading-[28px] mb-5">
        {answer.body}
      </Typography>

      {/* Footer Actions */}
      <View className="flex-row items-center justify-between pt-3 border-t border-outline-variant/30">
        {/* Violet Helpful Reaction Toggle with Subtle Glow Effect */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Mark answer helpful, ${answer.helpful_count} marks`}
          accessibilityState={{ selected: Boolean(answer.is_helpful) }}
          onPress={() => {
            AppHaptics.medium();
            onHelpfulPress?.(answer.id);
          }}
          className={`flex-row items-center space-x-2 px-3.5 py-1.5 rounded-full border ${
            answer.is_helpful
              ? "bg-secondary-container/50 border-secondary/60"
              : "bg-surface-container-high border-outline-variant/40 active:bg-surface-container-highest"
          }`}
        >
          <ThumbsUp
            size={14}
            color={answer.is_helpful ? "#C084FC" : "#94A3B8"}
            fill={answer.is_helpful ? "#C084FC" : "none"}
          />
          <Typography
            variant="label-md"
            className={answer.is_helpful ? "text-secondary font-bold" : "text-on-surface-variant"}
          >
            Helpful ({answer.helpful_count})
          </Typography>
        </TouchableOpacity>

        {/* Comments toggle */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`${showComments ? "Hide" : "Show"} comments on this answer`}
          onPress={() => {
            AppHaptics.light();
            setShowComments((v) => !v);
          }}
          className="flex-row items-center space-x-1.5 px-3 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/40 active:bg-surface-container-highest"
        >
          {showComments ? (
            <ChevronUp size={14} color="#94A3B8" />
          ) : (
            <ChevronDown size={14} color="#94A3B8" />
          )}
          <MessageSquare size={13} color="#94A3B8" />
          <Typography variant="label-md" className="text-on-surface-variant">
            {comments.length > 0 ? `(${comments.length})` : ""}
          </Typography>
        </TouchableOpacity>

        {/* Accept Solution CTA for Question Author */}
        {isQuestionAuthor && !answer.is_accepted && (
          <Button
            variant="solved"
            size="sm"
            loading={isAccepting}
            leftIcon={<CheckCircle2 size={14} color="#34D399" />}
            onPress={() => onAcceptPress?.(answer.id)}
          >
            Accept
          </Button>
        )}
      </View>

      {/* Comment thread — same pattern as question discussion */}
      {showComments && (
        <View className="mt-4 pt-4 border-t border-outline-variant/25">
          {comments.length === 0 ? (
            <Typography variant="body-sm" className="text-on-surface-variant/70 normal-case mb-2 pl-1">
              No comments yet.
            </Typography>
          ) : (
            comments.map((c: PostComment) => (
              <View key={c.id} className="mb-2.5">
                <View className="flex-row items-center space-x-2 mb-0.5">
                  <Avatar
                    name={c.author_display_name}
                    uri={c.author_avatar_path}
                    size="sm"
                    role={c.author_status}
                    isVerified={c.author_is_verified}
                  />
                  <Typography variant="label-sm" className="text-on-surface font-semibold flex-1" numberOfLines={1}>
                    {c.author_display_name}
                  </Typography>
                </View>
                <Typography variant="body-sm" className="text-on-surface leading-relaxed pl-9">
                  {c.body}
                </Typography>
              </View>
            ))
          )}

          {/* Inline composer */}
          <View className="flex-row items-center space-x-2 mt-2">
            <TextInput
              placeholder="Comment on this answer…"
              value={commentText}
              onChangeText={setCommentText}
              containerClassName="flex-1 mb-0"
              maxLength={1000}
              className="py-1.5 text-sm"
            />
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Post comment on answer"
              disabled={commentText.trim().length < 1 || commentMutation.isPending}
              onPress={() => commentMutation.mutate()}
              className={`w-9 h-9 rounded-full items-center justify-center ${
                commentText.trim().length >= 1
                  ? "bg-primary"
                  : "bg-surface-container-high border border-outline-variant/40"
              }`}
            >
              <Send
                size={15}
                color={commentText.trim().length >= 1 ? "#0F172A" : "#64748B"}
              />
            </TouchableOpacity>
          </View>
          {commentMutation.isError && (
            <Typography variant="label-sm" className="text-error mt-1.5 normal-case">
              {normalizeError(commentMutation.error).message}
            </Typography>
          )}
        </View>
      )}
    </Card>
  );
}

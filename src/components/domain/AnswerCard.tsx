import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { ContributorBadge } from "./ContributorBadge";
import { AuthorHeader } from "@/components/domain/AuthorHeader";
import { HelpfulChip } from "@/components/domain/HelpfulChip";
import { useAnswerComments } from "@/hooks/useAnswerComments";
import { PostComment } from "@/services/posts";
import { UserStatusEnum } from "@/types/database";
import { AppHaptics } from "@/lib/haptics";
import {
  CheckCircle2,
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
  currentUserId?: string;
  onAcceptPress?: (id: string) => void;
  onHelpfulPress?: (id: string) => void;
  isAccepting?: boolean;
}

/**
 * Answer card with an expandable comment thread. Comments are fetched
 * and submitted via the dedicated useAnswerComments hook.
 */
export const AnswerCard = React.memo(function AnswerCard({
  answer,
  isQuestionAuthor = false,
  currentUserId,
  onAcceptPress,
  onHelpfulPress,
  isAccepting = false,
}: AnswerCardProps) {
  const [showComments, setShowComments] = useState(false);
  const isSelfAnswer = Boolean(currentUserId && answer.author_id === currentUserId);
  const [commentText, setCommentText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const { comments, submitComment, isSubmitting } = useAnswerComments(
    answer.id,
    answer.question_id,
    showComments
  );

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || isSubmitting) return;
    try {
      setErrorMessage("");
      await submitComment(commentText);
      setCommentText("");
    } catch {
      setErrorMessage("Could not post comment. Please try again.");
    }
  };

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
      <AuthorHeader
        displayName={answer.author_display_name}
        avatarPath={answer.author_avatar_path}
        status={answer.author_status}
        isVerified={answer.author_is_verified}
        avatarSize="md"
        subtitle={answer.institution_name || "Academic Contributor"}
        rightAccessory={
          <ContributorBadge
            status={answer.author_status}
            isVerified={answer.author_is_verified}
          />
        }
        className="mb-4"
      />

      {/* Long-form Answer Body with Generous Line Height */}
      <Typography variant="body-lg" className="text-on-surface leading-[28px] mb-5">
        {answer.body}
      </Typography>

      {/* Footer Actions */}
      <View className="flex-row items-center justify-between pt-3 border-t border-outline-variant/30">
        {/* Helpful Reaction */}
        <HelpfulChip
          count={answer.helpful_count}
          isHelpful={answer.is_helpful}
          disabled={isSelfAnswer}
          label="Helpful"
          onPress={() => onHelpfulPress?.(answer.id)}
          accessibilityLabel={
            isSelfAnswer
              ? `Your answer, ${answer.helpful_count} marks`
              : `Mark answer helpful, ${answer.helpful_count} marks`
          }
        />

        {/* Comments toggle */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`${showComments ? "Hide" : "Show"} comments on this answer`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => {
            AppHaptics.light();
            setShowComments((v) => !v);
          }}
          className="flex-row items-center space-x-1.5 px-3.5 py-2 min-h-[44px] rounded-full bg-surface-container-high border border-outline-variant/40 web:cursor-pointer select-none active:bg-surface-container-highest"
        >
          {showComments ? (
            <ChevronUp size={14} color="#94A3B8" />
          ) : (
            <ChevronDown size={14} color="#94A3B8" />
          )}
          <MessageSquare size={13} color="#94A3B8" />
          <Typography variant="label-md" className="text-on-surface-variant">
            ({comments.length})
          </Typography>
        </TouchableOpacity>

        {/* Accept Solution CTA for Question Author — only if not the answer author */}
        {isQuestionAuthor && !isSelfAnswer && !answer.is_accepted && (
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

      {/* Comment thread */}
      {showComments && (
        <View className="mt-4 pt-4 border-t border-outline-variant/25">
          {comments.length === 0 ? (
            <Typography variant="body-sm" className="text-on-surface-variant/70 mb-2 pl-1">
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
              disabled={commentText.trim().length < 1 || isSubmitting}
              onPress={handleCommentSubmit}
              className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-full items-center justify-center web:cursor-pointer select-none active:scale-95 transition-transform ${
                commentText.trim().length >= 1
                  ? "bg-primary shadow-sm shadow-primary/30"
                  : "bg-surface-container-high border border-outline-variant/40"
              }`}
            >
              <Send
                size={17}
                color={commentText.trim().length >= 1 ? "#0F172A" : "#64748B"}
              />
            </TouchableOpacity>
          </View>
          {errorMessage ? (
            <Typography variant="label-sm" className="text-error mt-1.5">
              {errorMessage}
            </Typography>
          ) : null}
        </View>
      )}
    </Card>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.answer.id === nextProps.answer.id &&
    prevProps.answer.is_accepted === nextProps.answer.is_accepted &&
    prevProps.answer.is_helpful === nextProps.answer.is_helpful &&
    prevProps.answer.helpful_count === nextProps.answer.helpful_count &&
    prevProps.answer.body === nextProps.answer.body &&
    prevProps.isQuestionAuthor === nextProps.isQuestionAuthor &&
    prevProps.currentUserId === nextProps.currentUserId &&
    prevProps.isAccepting === nextProps.isAccepting
  );
});

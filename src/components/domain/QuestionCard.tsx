import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { Badge } from "@/components/ui/Badge";
import { AuthorHeader } from "@/components/domain/AuthorHeader";
import { HelpfulChip } from "@/components/domain/HelpfulChip";
import { UserStatusEnum, QuestionStatusEnum } from "@/types/database";
import { AppHaptics } from "@/lib/haptics";
import { formatDate } from "@/lib/date";
import { MessageSquare, CheckCircle2 } from "lucide-react-native";

export interface QuestionCardData {
  id: string;
  author_id: string | null;
  author_username: string;
  author_display_name: string;
  author_avatar_path: string | null;
  author_status: UserStatusEnum;
  author_is_verified: boolean;
  institution_name?: string | null;
  title: string;
  body: string;
  status: QuestionStatusEnum;
  answer_count: number;
  helpful_count: number;
  created_at: string;
  is_helpful?: boolean;
}

interface QuestionCardProps {
  question: QuestionCardData;
  onPress?: () => void;
  onHelpfulPress?: (id: string) => void;
}

export const QuestionCard = React.memo(function QuestionCard({
  question,
  onPress,
  onHelpfulPress,
}: QuestionCardProps) {
  const router = useRouter();
  const isSolved = question.status === "solved";

  const handlePress = () => {
    AppHaptics.light();
    if (onPress) {
      onPress();
    } else {
      router.push(`/question/${question.id}` as any);
    }
  };

  return (
    <Card
      onPress={handlePress}
      isSolved={isSolved}
      className="mb-4"
    >
      {/* Top Header: Author Context & Status */}
      <AuthorHeader
        displayName={question.author_display_name}
        avatarPath={question.author_avatar_path}
        status={question.author_status}
        isVerified={question.author_is_verified}
        subtitle={question.institution_name || "Student"}
        rightAccessory={
          isSolved ? (
            <Badge
              variant="solved"
              label="Solved"
              icon={<CheckCircle2 size={13} color="#34D399" />}
            />
          ) : (
            <Badge variant="open" label="Open" />
          )
        }
      />

      {/* Question Title & Body */}
      <Typography variant="headline-sm" className="text-on-surface mb-2 font-bold leading-snug tracking-tight">
        {question.title}
      </Typography>
      <Typography
        variant="body-md"
        className="text-on-surface-variant leading-relaxed mb-4 text-[15px]"
        numberOfLines={3}
      >
        {question.body}
      </Typography>

      {/* Footer Metrics with Tactile Interactive Chips */}
      <View className="flex-row items-center justify-between pt-3 border-t border-white/[0.08]">
        <View className="flex-row items-center space-x-2.5">
          {/* Answers Chip with Solved Indicator */}
          <View
            className={`flex-row items-center space-x-1.5 min-h-[38px] px-3.5 py-1.5 rounded-full border ${
              isSolved
                ? "bg-tertiary-container/35 border-tertiary/50 shadow-sm shadow-tertiary/20"
                : question.answer_count > 0
                ? "bg-primary-container/35 border-primary/40 shadow-sm shadow-primary/20"
                : "bg-surface-container-high/80 border-white/[0.08]"
            }`}
          >
            {isSolved ? (
              <CheckCircle2 size={14} color="#34D399" />
            ) : (
              <MessageSquare
                size={14}
                color={question.answer_count > 0 ? "#818CF8" : "#94A3B8"}
              />
            )}
            <Typography
              variant="label-md"
              className={
                isSolved
                  ? "text-tertiary font-bold tracking-tight"
                  : question.answer_count > 0
                  ? "text-primary font-bold tracking-tight"
                  : "text-on-surface-variant/80 font-medium"
              }
            >
              {question.answer_count} {question.answer_count === 1 ? "answer" : "answers"}
            </Typography>
          </View>

          {/* Helpful Upvote Chip */}
          <HelpfulChip
            count={question.helpful_count}
            isHelpful={question.is_helpful}
            onPress={() => onHelpfulPress?.(question.id)}
            accessibilityLabel={`Mark question as helpful, ${question.helpful_count} marks`}
          />
        </View>

        <Typography variant="label-sm" className="text-on-surface-variant/60 font-medium">
          {formatDate(question.created_at)}
        </Typography>
      </View>
    </Card>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.question.id === nextProps.question.id &&
    prevProps.question.is_helpful === nextProps.question.is_helpful &&
    prevProps.question.helpful_count === nextProps.question.helpful_count &&
    prevProps.question.answer_count === nextProps.question.answer_count &&
    prevProps.question.status === nextProps.question.status &&
    prevProps.question.title === nextProps.question.title &&
    prevProps.question.body === nextProps.question.body &&
    prevProps.question.author_avatar_path === nextProps.question.author_avatar_path &&
    prevProps.question.author_display_name === nextProps.question.author_display_name
  );
});

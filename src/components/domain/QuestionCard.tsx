import React from "react";
import { View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { UserStatusEnum, QuestionStatusEnum } from "@/types/database";
import { AppHaptics } from "@/lib/haptics";
import { MessageSquare, ThumbsUp, CheckCircle2 } from "lucide-react-native";

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

export function QuestionCard({ question, onPress, onHelpfulPress }: QuestionCardProps) {
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
      <View className="flex-row items-center justify-between mb-3.5">
        <View className="flex-row items-center space-x-3 flex-1 mr-3">
          <Avatar
            name={question.author_display_name}
            uri={question.author_avatar_path}
            size="sm"
            role={question.author_status}
            isVerified={question.author_is_verified}
          />
          <View className="flex-1">
            <Typography variant="label-md" className="text-on-surface font-semibold" numberOfLines={1}>
              {question.author_display_name}
            </Typography>
            <Typography variant="label-sm" className="text-on-surface-variant/70 mt-0.5 normal-case">
              {question.institution_name ? question.institution_name : "Student Scholar"}
            </Typography>
          </View>
        </View>

        {isSolved ? (
          <Badge
            variant="solved"
            label="Solved"
            icon={<CheckCircle2 size={13} color="#34D399" />}
          />
        ) : (
          <Badge variant="open" label="Open" />
        )}
      </View>

      {/* Question Title & Body */}
      <Typography variant="headline-sm" className="text-on-surface mb-2 font-bold leading-snug">
        {question.title}
      </Typography>
      <Typography
        variant="body-md"
        className="text-on-surface-variant leading-relaxed mb-4"
        numberOfLines={3}
      >
        {question.body}
      </Typography>

      {/* Footer Metrics with Tactile Interactive Chips */}
      <View className="flex-row items-center justify-between pt-3 border-t border-outline-variant/40">
        <View className="flex-row items-center space-x-2.5">
          {/* Answers Chip */}
          <View
            className={`flex-row items-center space-x-1.5 px-3 py-1.5 rounded-full border ${
              question.answer_count > 0
                ? "bg-primary-container/30 border-primary/30"
                : "bg-surface-container-high border-outline-variant/40"
            }`}
          >
            <MessageSquare
              size={14}
              color={question.answer_count > 0 ? "#818CF8" : "#94A3B8"}
            />
            <Typography
              variant="label-md"
              className={question.answer_count > 0 ? "text-primary font-bold" : "text-on-surface-variant/80"}
            >
              {question.answer_count} {question.answer_count === 1 ? "answer" : "answers"}
            </Typography>
          </View>

          {/* Helpful Upvote Chip */}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Mark question as helpful, ${question.helpful_count} marks`}
            accessibilityState={{ selected: Boolean(question.is_helpful) }}
            onPress={(e) => {
              e.stopPropagation();
              AppHaptics.medium();
              onHelpfulPress?.(question.id);
            }}
            className={`flex-row items-center space-x-1.5 px-3 py-1.5 rounded-full border ${
              question.is_helpful
                ? "bg-secondary-container/40 border-secondary/50"
                : "bg-surface-container-high border-outline-variant/40 active:bg-surface-container-highest"
            }`}
          >
            <ThumbsUp
              size={14}
              color={question.is_helpful ? "#C084FC" : "#94A3B8"}
              fill={question.is_helpful ? "#C084FC" : "none"}
            />
            <Typography
              variant="label-md"
              className={question.is_helpful ? "text-secondary font-bold" : "text-on-surface-variant/80"}
            >
              {question.helpful_count}
            </Typography>
          </TouchableOpacity>
        </View>

        <Typography variant="label-sm" className="text-on-surface-variant/60 font-medium normal-case">
          {new Date(question.created_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </Typography>
      </View>
    </Card>
  );
}

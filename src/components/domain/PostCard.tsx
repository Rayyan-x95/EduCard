import React from "react";
import { View } from "react-native";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { AuthorHeader } from "@/components/domain/AuthorHeader";
import { HelpfulChip } from "@/components/domain/HelpfulChip";
import { UserStatusEnum } from "@/types/database";
import { AppHaptics } from "@/lib/haptics";
import { formatDate } from "@/lib/date";
import { MessageSquare } from "lucide-react-native";

export interface PostCardData {
  id: string;
  author_id: string;
  author_display_name: string;
  author_avatar_path: string | null;
  author_status: UserStatusEnum;
  author_is_verified: boolean;
  community_name?: string | null;
  body: string;
  helpful_count: number;
  comment_count: number;
  created_at: string;
  is_helpful?: boolean;
}

interface PostCardProps {
  post: PostCardData;
  onPress?: () => void;
  onHelpfulPress?: (id: string) => void;
}

export const PostCard = React.memo(function PostCard({ post, onPress, onHelpfulPress }: PostCardProps) {
  const handlePress = () => {
    AppHaptics.light();
    onPress?.();
  };

  const subtitle = (
    <View className="flex-row items-center mt-0.5">
      {post.community_name && (
        <View className="px-2 py-0.5 mr-2 rounded-md bg-primary-container/60 border border-primary/40">
          <Typography variant="label-sm" className="text-primary-light font-bold text-[11px] normal-case">
            {post.community_name}
          </Typography>
        </View>
      )}
      <Typography variant="label-sm" className="text-on-surface-muted font-medium normal-case">
        {post.author_status === "professional" || post.author_status === "mentor"
          ? "Professional"
          : post.author_status === "alumni"
          ? "Alumni"
          : "Student"}
      </Typography>
    </View>
  );

  return (
    <Card onPress={handlePress} className="mb-3.5 bg-surface-container-low/60 border-outline-variant/40 rounded-[20px]">
      {/* Author Header */}
      <AuthorHeader
        displayName={post.author_display_name}
        avatarPath={post.author_avatar_path}
        status={post.author_status}
        isVerified={post.author_is_verified}
        subtitle={subtitle}
        rightAccessory={
          <Typography variant="label-sm" className="text-on-surface-muted font-medium">
            {formatDate(post.created_at)}
          </Typography>
        }
      />

      {/* Discussion Body */}
      <Typography variant="body-md" className="text-on-surface leading-relaxed mb-4 text-[14px]" numberOfLines={4}>
        {post.body}
      </Typography>

      {/* Footer Metrics */}
      <View className="flex-row items-center justify-between pt-3.5 border-t border-outline-variant">
        <View className="flex-row items-center">
          <View className="flex-row items-center mr-2.5 min-h-[40px] px-3.5 py-1.5 rounded-full bg-surface-container-high border border-outline-variant">
            <View className="mr-1.5"><MessageSquare size={14} color="#A3B3C4" /></View>
            <Typography variant="label-md" className="text-on-surface-variant font-medium tracking-tight">
              {post.comment_count} {post.comment_count === 1 ? "comment" : "comments"}
            </Typography>
          </View>

          <HelpfulChip
            count={post.helpful_count}
            isHelpful={post.is_helpful}
            onPress={() => onHelpfulPress?.(post.id)}
            accessibilityLabel={`Mark post helpful, ${post.helpful_count} marks`}
          />
        </View>
      </View>
    </Card>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.is_helpful === nextProps.post.is_helpful &&
    prevProps.post.helpful_count === nextProps.post.helpful_count &&
    prevProps.post.comment_count === nextProps.post.comment_count &&
    prevProps.post.body === nextProps.post.body &&
    prevProps.post.author_avatar_path === nextProps.post.author_avatar_path &&
    prevProps.post.author_display_name === nextProps.post.author_display_name &&
    prevProps.post.community_name === nextProps.post.community_name
  );
});

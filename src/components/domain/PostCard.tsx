import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { Avatar } from "@/components/ui/Avatar";
import { UserStatusEnum } from "@/types/database";
import { AppHaptics } from "@/lib/haptics";
import { MessageSquare, ThumbsUp } from "lucide-react-native";

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

export function PostCard({ post, onPress, onHelpfulPress }: PostCardProps) {
  const handlePress = () => {
    AppHaptics.light();
    onPress?.();
  };

  return (
    <Card onPress={handlePress} className="mb-4">
      {/* Author Header */}
      <View className="flex-row items-center justify-between mb-3.5">
        <View className="flex-row items-center space-x-3 flex-1 mr-2">
          <Avatar
            name={post.author_display_name}
            uri={post.author_avatar_path}
            size="sm"
            role={post.author_status}
            isVerified={post.author_is_verified}
          />
          <View className="flex-1">
            <Typography variant="label-md" className="text-on-surface font-semibold" numberOfLines={1}>
              {post.author_display_name}
            </Typography>
            {post.community_name ? (
              <Typography variant="label-sm" className="text-primary font-bold mt-0.5 normal-case">
                in {post.community_name}
              </Typography>
            ) : (
              <Typography variant="label-sm" className="text-on-surface-variant/70 mt-0.5 normal-case">
                Scholarly Discussion
              </Typography>
            )}
          </View>
        </View>

        <Typography variant="label-sm" className="text-on-surface-variant/60 font-medium normal-case">
          {new Date(post.created_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </Typography>
      </View>

      {/* Discussion Body */}
      <Typography variant="body-md" className="text-on-surface leading-relaxed mb-4" numberOfLines={4}>
        {post.body}
      </Typography>

      {/* Footer Metrics */}
      <View className="flex-row items-center justify-between pt-3 border-t border-outline-variant/30">
        <View className="flex-row items-center space-x-3">
          <View className="flex-row items-center space-x-1.5 px-3 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/40">
            <MessageSquare size={14} color="#94A3B8" />
            <Typography variant="label-md" className="text-on-surface-variant/80">
              {post.comment_count} comments
            </Typography>
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Mark post helpful, ${post.helpful_count} marks`}
            accessibilityState={{ selected: Boolean(post.is_helpful) }}
            onPress={(e) => {
              e.stopPropagation();
              AppHaptics.medium();
              onHelpfulPress?.(post.id);
            }}
            className={`flex-row items-center space-x-1.5 px-3 py-1.5 rounded-full border ${
              post.is_helpful
                ? "bg-secondary-container/40 border-secondary/50"
                : "bg-surface-container-high border-outline-variant/40 active:bg-surface-container-highest"
            }`}
          >
            <ThumbsUp
              size={14}
              color={post.is_helpful ? "#C084FC" : "#94A3B8"}
              fill={post.is_helpful ? "#C084FC" : "none"}
            />
            <Typography
              variant="label-md"
              className={post.is_helpful ? "text-secondary font-bold" : "text-on-surface-variant/80"}
            >
              {post.helpful_count}
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
}

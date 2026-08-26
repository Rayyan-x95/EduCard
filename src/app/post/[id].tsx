import React, { useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Typography } from "@/components/ui/Typography";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { PostsService } from "@/services/posts";
import { StorageService } from "@/services/storage";
import { QuestionsService } from "@/services/questions";
import { BookmarksService } from "@/services/bookmarks";
import { AppHaptics } from "@/lib/haptics";
import { normalizeError } from "@/lib/errors";
import { ShareService } from "@/lib/sharing";
import { useAuthStore } from "@/stores/authStore";
import { queryKeys } from "@/lib/query-client";
import {
  ArrowLeft,
  MessageSquare,
  Send,
  ThumbsUp,
  Bookmark,
  Share2,
  Flag,
} from "lucide-react-native";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [commentText, setCommentText] = useState("");
  const [error, setError] = useState("");

  const { data: post, isLoading, isError, refetch } = useQuery({
    queryKey: ["post", id as string],
    queryFn: () => PostsService.getPostById(id as string),
    enabled: Boolean(id),
  });

  // Bookmark state for this post
  const { data: isBookmarked = false } = useQuery({
    queryKey: queryKeys.isBookmarked("post", id || ""),
    queryFn: () => BookmarksService.isBookmarked("post", id || "", user?.id || ""),
    enabled: Boolean(id && user?.id),
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => {
      if (!user?.id) throw Object.assign(new Error("Please sign in first."), { code: "APP_ERROR" });
      return BookmarksService.toggleBookmark("post", id as string, user.id);
    },
    onSuccess: () => {
      AppHaptics.success();
      queryClient.invalidateQueries({ queryKey: queryKeys.isBookmarked("post", id || "") });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks("post") });
    },
    onError: (err) => setError(normalizeError(err).message),
  });

  const { data: comments = [], isLoading: cLoading, refetch: refetchComments } = useQuery({
    queryKey: ["post-comments", id as string],
    queryFn: () => PostsService.listComments(id as string),
    enabled: Boolean(id),
  });

  const imagePaths = (post as any)?.image_paths as string[] | null | undefined;
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    if (Array.isArray(imagePaths) && imagePaths.length > 0) {
      StorageService.getSignedAttachmentUrls(imagePaths).then((urls) => {
        if (!cancelled) setImageUrls(urls);
      });
    } else setImageUrls([]);
    return () => { cancelled = true; };
  }, [imagePaths]);

  const reactionMutation = useMutation({
    mutationFn: () => QuestionsService.toggleReaction("post", id as string),
    onSuccess: () => {
      AppHaptics.medium();
      queryClient.invalidateQueries({ queryKey: ["post", id as string] });
    },
    onError: (err) => setError(normalizeError(err).message),
  });

  const commentMutation = useMutation({
    mutationFn: () => PostsService.createComment({ postId: id as string, body: commentText.trim() }),
    onSuccess: () => {
      AppHaptics.success();
      setCommentText("");
      setError("");
      queryClient.invalidateQueries({ queryKey: ["post-comments", id as string] });
      queryClient.invalidateQueries({ queryKey: ["post", id as string] });
    },
    onError: (err) => setError(normalizeError(err).message),
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-1 px-5 py-5 space-y-4">
          <Skeleton height={28} width="85%" className="bg-surface-container" />
          <Skeleton height={100} className="bg-surface-container" />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !post) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <ErrorState
          title="Couldn't load this post"
          message="It may have been removed."
          errorCode="POST_LOAD_FAILED"
          onRetry={() => refetch()}
          onGoHome={() => router.replace("/(tabs)" as any)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-surface-container-high/80">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => { AppHaptics.light(); if (router.canGoBack()) router.back(); else router.replace("/(tabs)" as any); }}
          className="w-10 h-10 rounded-xl bg-surface-container items-center justify-center border border-outline-variant/60"
        >
          <ArrowLeft size={20} color="#F8FAFC" />
        </TouchableOpacity>
        <Typography variant="label-lg" className="text-on-surface font-bold">Discussion</Typography>
        <View className="flex-row items-center space-x-1.5">
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Share this post"
            onPress={() => { AppHaptics.light(); ShareService.copyToClipboard(`https://educard.app/post/${id}`, "Post link"); }}
            className="w-10 h-10 rounded-xl bg-surface-container items-center justify-center border border-outline-variant/60 active:bg-surface-container-high"
          >
            <Share2 size={18} color="#818CF8" />
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={isBookmarked ? "Remove bookmark" : "Bookmark post"}
            accessibilityState={{ selected: !!isBookmarked }}
            onPress={() => {
              AppHaptics.light();
              if (!bookmarkMutation.isPending) bookmarkMutation.mutate();
            }}
            className="w-10 h-10 rounded-xl bg-surface-container items-center justify-center border border-outline-variant/60 active:bg-surface-container-high"
          >
            <Bookmark
              size={18}
              color={isBookmarked ? "#818CF8" : "#94A3B8"}
              fill={isBookmarked ? "#818CF8" : "none"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Report this post"
            onPress={() => {
              AppHaptics.light();
              router.push({
                pathname: "/report",
                params: { targetType: "post", targetId: id || "", targetUserId: post.author_id || "" },
              } as any);
            }}
            className="w-10 h-10 rounded-xl bg-surface-container items-center justify-center border border-outline-variant/60 active:bg-surface-container-high"
          >
            <Flag size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5 py-5"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => { refetch(); refetchComments(); }} tintColor="#818CF8" />}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {/* Author header — tap to open public profile */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`View ${post.author?.display_name || "scholar"}'s profile`}
          disabled={!post.author_id}
          onPress={() => {
            AppHaptics.light();
            if (post.author_id) router.push(`/user/${post.author_id}` as any);
          }}
          className="flex-row items-center space-x-3 mb-4 active:opacity-70"
        >
          <Avatar name={post.author?.display_name || "Scholar"} uri={post.author?.avatar_path} size="md" role={post.author?.current_status || "undergraduate"} isVerified={post.author?.is_verified || false} />
          <View className="flex-1">
            <Typography variant="label-md" className="text-on-surface font-bold">{post.author?.display_name || "Scholar"}</Typography>
            <Typography variant="label-sm" className="text-on-surface-variant/70">{new Date(post.created_at).toLocaleDateString()}</Typography>
          </View>
        </TouchableOpacity>

        <Typography variant="body-lg" className="text-on-surface leading-[28px] mb-4">{post.body}</Typography>

        {imageUrls.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
            <View className="flex-row gap-3">
              {imageUrls.map((url, idx) => (
                <Image key={url} source={{ uri: url }} style={{ width: 180, height: 180, borderRadius: 16 }} contentFit="cover" recyclingKey={url} accessibilityLabel={`Attached image ${idx + 1}`} />
              ))}
            </View>
          </ScrollView>
        )}

        <View className="flex-row items-center space-x-2 mb-6">
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Helpful ${post.helpful_count}`}
            onPress={() => reactionMutation.mutate()}
            className="flex-row items-center space-x-1.5 px-3 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/40"
          >
            <ThumbsUp size={14} color="#94A3B8" />
            <Typography variant="label-md" className="text-on-surface-variant">{post.helpful_count}</Typography>
          </TouchableOpacity>
          <View className="flex-row items-center space-x-1 px-3 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/40">
            <MessageSquare size={14} color="#94A3B8" />
            <Typography variant="label-md" className="text-on-surface-variant">{post.comment_count} comments</Typography>
          </View>
        </View>

        <View className="pt-4 border-t border-surface-container-high/80">
          <Typography variant="headline-sm" className="text-on-surface font-bold mb-3">{comments.length} Comments</Typography>
          {cLoading ? (
            <Skeleton height={80} className="bg-surface-container mb-3" />
          ) : comments.length > 0 ? (
            comments.map((c: any) => (
              <Card key={c.id} className="p-4 mb-3 border border-outline-variant/60">
                <View className="flex-row items-center space-x-2 mb-2">
                  <Avatar name={c.author_display_name} uri={c.author_avatar_path} size="sm" role={c.author_status} isVerified={c.author_is_verified} />
                  <Typography variant="label-md" className="text-on-surface font-bold flex-1">{c.author_display_name}</Typography>
                </View>
                <Typography variant="body-md" className="text-on-surface leading-relaxed">{c.body}</Typography>
              </Card>
            ))
          ) : (
            <Card className="p-6 items-center border border-outline-variant/60">
              <Typography variant="body-sm" className="text-on-surface-variant text-center">No comments yet. Be the first to share your thoughts.</Typography>
            </Card>
          )}
        </View>
      </ScrollView>

      <View className="p-4 bg-surface-container-high border-t border-outline-variant/60">
        {error ? <Typography variant="label-sm" className="text-error mb-2">{error}</Typography> : null}
        <View className="flex-row items-center space-x-3">
          <TextInput placeholder="Add a comment..." value={commentText} onChangeText={setCommentText} containerClassName="flex-1 mb-0" multiline maxLength={1000} className="max-h-20" />
          <Button variant="primary" size="md" loading={commentMutation.isPending} disabled={commentText.trim().length < 1} onPress={() => commentMutation.mutate()} className="px-4">
            <Send size={18} color="#0F172A" />
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

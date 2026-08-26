import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Typography } from "@/components/ui/Typography";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { QuestionCard } from "@/components/domain/QuestionCard";
import { PostCard } from "@/components/domain/PostCard";
import {
  BookmarksService,
  BookmarkItem,
  BookmarksCursor,
} from "@/services/bookmarks";
import { queryKeys } from "@/lib/query-client";
import { useAuthStore } from "@/stores/authStore";
import { AppHaptics } from "@/lib/haptics";
import { normalizeError } from "@/lib/errors";
import { Alert } from "react-native";
import { ArrowLeft, Bookmark, Compass, Trash2 } from "lucide-react-native";

export default function BookmarksScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"questions" | "posts">("questions");

  const targetType = activeTab === "posts" ? "post" : "question";

  // In-flight removals so cards can show immediate feedback.
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const removeMutation = useMutation({
    mutationFn: (bm: BookmarkItem) =>
      BookmarksService.toggleBookmark(
        bm.item_type,
        bm.id,
        user!.id!
      ),
    onSuccess: (_result, bm) => {
      AppHaptics.success();
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks("question") });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks("post") });
    },
    onError: (err, bm) => {
      Alert.alert("Couldn't remove", normalizeError(err).message);
    },
    onSettled: (_d, _e, bm) => {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete((bm as BookmarkItem).bookmark_id);
        return next;
      });
    },
  });

  const confirmRemove = (bm: BookmarkItem) => {
    setRemovingIds((prev) => new Set(prev).add(bm.bookmark_id));
    removeMutation.mutate(bm);
  };

  const {
    data,
    isLoading,
    isError,
    isRefetching,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.bookmarks(targetType),
    queryFn: ({ pageParam }) =>
      BookmarksService.getBookmarksPage(targetType, pageParam),
    initialPageParam: null as BookmarksCursor | null,
    getNextPageParam: (lastPage) =>
      BookmarksService.nextBookmarksCursor(lastPage) ?? undefined,
    enabled: Boolean(user?.id),
  });

  // Keyset-paginated: only loaded pages are held in memory and rendered.
  const bookmarks = React.useMemo(() => data?.pages.flat() ?? [], [data]);

  const hasBookmarks = bookmarks.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="px-5 py-3 border-b border-surface-container-high/80 flex-row items-center">
        <TouchableOpacity
          onPress={() => {
            AppHaptics.light();
            if (router.canGoBack()) router.back(); else router.replace('/(tabs)' as any);
          }}
          className="w-10 h-10 rounded-xl bg-surface-container items-center justify-center border border-outline-variant/60 mr-3 active:bg-surface-container-high"
        >
          <ArrowLeft size={20} color="#F8FAFC" />
        </TouchableOpacity>
        <Typography variant="label-lg" className="text-on-surface font-bold">
          Saved Library
        </Typography>
      </View>

      <ScrollView
        className="flex-1 px-5 py-5"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#818CF8"
          />
        }
      >
        <Typography variant="headline-lg" className="text-on-surface mb-1 font-bold text-2xl">
          Bookmarks & Saved
        </Typography>
        <Typography variant="body-md" className="text-on-surface-variant mb-5 leading-relaxed">
          Your saved intellectual assets, curated for deep reading and research.
        </Typography>

        {/* Tab Filters */}
        <View className="flex-row bg-surface-container-low p-1 rounded-2xl border border-white/[0.06] mb-6">
          {(["questions", "posts"] as const).map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => {
                  AppHaptics.selection();
                  setActiveTab(tab);
                }}
                className={`flex-1 py-2 rounded-xl items-center justify-center transition-all ${
                  isSelected
                    ? "bg-surface-container-high border border-white/[0.08] shadow-sm shadow-black/30"
                    : "border border-transparent"
                }`}
              >
                <Typography
                  variant="label-sm"
                  className={
                    isSelected
                      ? "text-primary font-bold capitalize"
                      : "text-on-surface-variant font-medium capitalize"
                  }
                >
                  {tab}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </View>

        {isLoading ? (
          <View className="space-y-4">
            <Skeleton height={140} className="w-full rounded-2xl bg-surface-container" />
            <Skeleton height={140} className="w-full rounded-2xl bg-surface-container" />
          </View>
        ) : isError ? (
          /* Failed fetch must never read as "no bookmarks yet". */
          <ErrorState
            title="Couldn't load bookmarks"
            message="We couldn't reach the network while loading your saved items. Check your connection and try again."
            onRetry={() => refetch()}
          />
        ) : hasBookmarks ? (
          <View className="space-y-4">
            {bookmarks.map((bm: BookmarkItem) => {
              const isRemoving = removingIds.has(bm.bookmark_id);
              const card =
                bm.item_type === "question" ? (
                  <QuestionCard
                    question={{
                      id: bm.id,
                      author_id: bm.author_id,
                      title: bm.title || "Untitled Question",
                      body: bm.body,
                      status: bm.status || "open",
                      answer_count: bm.answer_count,
                      helpful_count: bm.helpful_count,
                      created_at: bm.created_at,
                      author_display_name: bm.author_display_name,
                      author_username: bm.author_username,
                      author_avatar_path: bm.author_avatar_path,
                      author_status: bm.author_status,
                      author_is_verified: bm.author_is_verified,
                      is_helpful: false,
                    }}
                    onPress={() => {
                      AppHaptics.light();
                      router.push(`/question/${bm.id}` as any);
                    }}
                  />
                ) : bm.item_type === "post" ? (
                  <PostCard
                    post={{
                      id: bm.id,
                      author_id: bm.author_id || "",
                      author_display_name: bm.author_display_name,
                      author_avatar_path: bm.author_avatar_path,
                      author_status: bm.author_status,
                      author_is_verified: bm.author_is_verified,
                      body: bm.body,
                      helpful_count: bm.helpful_count,
                      comment_count: bm.comment_count,
                      created_at: bm.created_at,
                      is_helpful: false,
                    }}
                    onPress={() => {
                      AppHaptics.light();
                      router.push(`/post/${bm.id}` as any);
                    }}
                  />
                ) : null;

              if (!card) return null;

              return (
                <View key={bm.bookmark_id} className="relative">
                  {card}
                  {/* Quick-remove so the list manages itself without visiting
                      each item and unbookmarking there. */}
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${bm.item_type} from bookmarks`}
                    disabled={isRemoving}
                    onPress={() => confirmRemove(bm)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface-container-highest/90 border border-outline-variant/60 items-center justify-center active:bg-error-container"
                  >
                    <Trash2 size={14} color={isRemoving ? "#64748B" : "#F87171"} />
                  </TouchableOpacity>
                </View>
              );
            })}

            {hasNextPage && (
              <Button
                variant="outline"
                size="md"
                disabled={isFetchingNextPage}
                onPress={() => {
                  AppHaptics.light();
                  fetchNextPage();
                }}
                className="mt-2"
              >
                {isFetchingNextPage ? "Loading…" : "Load more"}
              </Button>
            )}
          </View>
        ) : (          /* Empty State */
          <View className="flex-1 items-center justify-center py-12">
            <Card className="p-8 items-center text-center max-w-sm w-full bg-surface-container border border-outline-variant/60 shadow-lg shadow-black/30">
              <View className="w-16 h-16 rounded-2xl bg-primary-container/30 border border-primary/30 items-center justify-center mb-4 shadow-sm shadow-primary/20">
                <Bookmark size={32} color="#818CF8" />
              </View>

              <Typography variant="headline-md" className="text-on-surface text-center mb-1.5 font-bold">
                No bookmarks yet
              </Typography>
              <Typography variant="body-md" className="text-on-surface-variant text-center mb-6 leading-relaxed">
                Your reading list is currently empty. Save insightful questions and key resources to build your personal knowledge base.
              </Typography>

              <Button
                variant="primary"
                size="md"
                leftIcon={<Compass size={18} color="#0F172A" />}
                onPress={() => {
                  AppHaptics.medium();
                  router.push("/(tabs)" as any);
                }}
              >
                Explore Content
              </Button>
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

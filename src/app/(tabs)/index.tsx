import React, { useCallback, useMemo } from "react";
import { View, RefreshControl, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { FlashList } from "@shopify/flash-list";
import { Typography } from "@/components/ui/Typography";
import { Avatar } from "@/components/ui/Avatar";

import { Button } from "@/components/ui/Button";
import { QuestionCard, QuestionCardData } from "@/components/domain/QuestionCard";
import { PostCard, PostCardData } from "@/components/domain/PostCard";
import { QuestionCardSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Logo } from "@/components/ui/Logo";
import {
  QuestionsService,
  FeedRow,
  FEED_PAGE_SIZE,
} from "@/services/questions";
import { queryKeys } from "@/lib/query-client";
import { useUIStore, FeedFilter as UIFeedFilter } from "@/stores/uiStore";
import { useAuthStore, Profile } from "@/stores/authStore";
import { AppHaptics } from "@/lib/haptics";
import { Search, Inbox } from "lucide-react-native";

const FILTERS = [
  { label: "For You", value: "all" },
  { label: "Unsolved", value: "unsolved" },
  { label: "Following", value: "following" },
  { label: "Campus", value: "university" },
] as const;

function feedRowToQuestion(row: FeedRow): QuestionCardData {
  return {
    id: row.id,
    author_id: row.author_id,
    author_username: row.author_username,
    author_display_name: row.author_display_name,
    author_avatar_path: row.author_avatar_path,
    author_status: row.author_status,
    author_is_verified: row.author_is_verified,
    title: row.title,
    body: row.body,
    status: row.status,
    answer_count: row.answer_count,
    helpful_count: row.helpful_count,
    created_at: row.created_at,
    is_helpful: row.is_helpful,
  };
}

function feedRowToPost(row: FeedRow): PostCardData {
  return {
    id: row.id,
    author_id: row.author_id ?? "",
    author_display_name: row.author_display_name,
    author_avatar_path: row.author_avatar_path,
    author_status: row.author_status,
    author_is_verified: row.author_is_verified,
    community_name: null,
    body: row.body,
    helpful_count: row.helpful_count,
    comment_count: row.comment_count,
    created_at: row.created_at,
    is_helpful: row.is_helpful,
  };
}

export default function HomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile } = useAuthStore();
  const activeFeedFilter = useUIStore((s) => s.activeFeedFilter);
  const setActiveFeedFilter = useUIStore((s) => s.setActiveFeedFilter);

  // Keyset-paginated infinite feed (questions + public posts merged).
  const {
    data,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: queryKeys.feed(activeFeedFilter),
    queryFn: ({ pageParam }) =>
      QuestionsService.getFeed(
        activeFeedFilter,
        pageParam?.cursorCreatedAt,
        pageParam?.cursorId
      ),
    initialPageParam: {} as { cursorCreatedAt?: string; cursorId?: string },
    getNextPageParam: (lastPage: FeedRow[]) => {
      if (!lastPage || lastPage.length < FEED_PAGE_SIZE) return undefined;
      const last = lastPage[lastPage.length - 1];
      return { cursorCreatedAt: last.created_at, cursorId: last.id };
    },
  });

  const questions = useMemo(
    () => (data?.pages.flat() ?? []) as FeedRow[],
    [data]
  );

  // Unified optimistic reaction toggle across questions and posts
  const reactionMutation = useMutation({
    mutationFn: (row: FeedRow) =>
      QuestionsService.toggleReaction(
        row.item_type === "post" ? "post" : "question",
        row.id
      ),
    onMutate: async (row) => {
      const key = queryKeys.feed(activeFeedFilter);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<{
        pages: FeedRow[][];
        pageParams: unknown[];
      }>(key);

      if (previous) {
        queryClient.setQueryData(key, {
          ...previous,
          pages: previous.pages.map((page) =>
            page.map((item) => {
              if (item.id !== row.id || item.item_type !== row.item_type) return item;
              const isActive = !item.is_helpful;
              return {
                ...item,
                is_helpful: isActive,
                helpful_count: Math.max(0, item.helpful_count + (isActive ? 1 : -1)),
              };
            })
          ),
        });
      }
      return { previous };
    },
    onError: (_err, _row, context) => {
      AppHaptics.error();
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.feed(activeFeedFilter), context.previous);
      }
      // Invalidate only on error so the feed reflects the true server state
      // after a failed optimistic update. On success, onMutate already applied
      // the correct state — no refetch needed.
      queryClient.invalidateQueries({ queryKey: queryKeys.feed(activeFeedFilter) });
    },
  });

  const renderItem = useCallback(
    ({ item }: { item: FeedRow }) =>
      item.item_type === "post" ? (
        <PostCard
          post={feedRowToPost(item)}
          onPress={() => router.push(`/post/${item.id}` as any)}
          onHelpfulPress={() => {
            if (reactionMutation.isPending) return;
            reactionMutation.mutate(item);
          }}
        />
      ) : (
        <QuestionCard
          question={feedRowToQuestion(item)}
          onPress={() => router.push(`/question/${item.id}`)}
          onHelpfulPress={() => {
            if (reactionMutation.isPending) return;
            reactionMutation.mutate(item);
          }}
        />
      ),
    [reactionMutation, router]
  );

  if (isError && questions.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <HeaderBar profile={profile} />
        <ErrorState
          title="Couldn't load your feed"
          message="We had trouble reaching the network. Check your connection and try again."
          errorCode="FEED_LOAD_FAILED"
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <HeaderBar profile={profile} />

      {/* Apple-Style Segmented Control Filter */}
      <View className="w-full items-center">
        <View className="w-full max-w-[720px] px-5 pt-3 pb-2">
          <SegmentedControl
            options={FILTERS}
            value={activeFeedFilter}
            onChange={(val) => setActiveFeedFilter(val as UIFeedFilter)}
          />
        </View>
      </View>

      {/* Feed List */}
      <View style={{ flex: 1, width: "100%", alignItems: "center" }}>
        <View style={{ flex: 1, width: "100%", maxWidth: 720 }}>
        <FlashList<FeedRow>
          data={questions}
          keyExtractor={(item) => `${item.item_type}:${item.id}`}
          extraData={activeFeedFilter}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24 }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#818CF8"
            />
          }
          ListHeaderComponent={
            <View className="mb-2">
              {/* Quick Ask / Post Prompt Card */}
              <View className="p-3.5 mb-4 bg-surface-container border border-white/[0.08] border-t-white/[0.16] rounded-2xl flex-row items-center space-x-3 shadow-md shadow-black/30 backdrop-blur-sm">
                <Avatar
                  name={profile?.display_name || "User"}
                  uri={profile?.avatar_path}
                  size="sm"
                  role={profile?.current_status || "undergraduate"}
                  isVerified={profile?.is_verified}
                />
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Ask a question or share a thought"
                  activeOpacity={0.85}
                  onPress={() => {
                    AppHaptics.light();
                    router.push("/question/new");
                  }}
                  className="flex-1 bg-surface-container-high/60 border border-white/[0.06] rounded-xl px-3.5 py-2.5 flex-row items-center web:cursor-pointer select-none active:bg-surface-container-high"
                >
                  <Typography variant="body-md" className="text-on-surface-variant/80 text-[14px]">
                    What are you trying to solve?
                  </Typography>
                </TouchableOpacity>
                <View className="flex-row items-center space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onPress={() => router.push("/post/new" as any)}
                    className="px-3.5 py-2 min-h-[38px] rounded-xl"
                  >
                    Post
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onPress={() => router.push("/question/new")}
                    className="px-4 py-2 min-h-[38px] rounded-xl"
                  >
                    Ask
                  </Button>
                </View>
              </View>
            </View>
          }
          ListFooterComponent={() => {
            if (isFetchingNextPage) {
              return (
                <View className="py-3">
                  <QuestionCardSkeleton />
                </View>
              );
            }
            if (isError && questions.length > 0) {
              return (
                <TouchableOpacity
                  onPress={() => {
                    refetch();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading more feed items"
                >
                  <View className="mx-1 my-3 p-4 rounded-xl bg-error-container/30 border border-error/40 items-center">
                    <Typography variant="label-sm" className="text-on-surface-variant text-center">
                      Couldn't load newer content. Tap to retry.
                    </Typography>
                  </View>
                </TouchableOpacity>
              );
            }
            return null;
          }}
          ListEmptyComponent={
            isLoading ? (
              <View className="space-y-4">
                <QuestionCardSkeleton />
                <QuestionCardSkeleton />
                <QuestionCardSkeleton />
              </View>
            ) : (
              <EmptyState
                icon={<Inbox size={32} color="#818CF8" />}
                title="No questions in this feed yet"
                description="Be the first to ask a question or join a community."
                actionLabel="Ask a Question"
                onAction={() => {
                  AppHaptics.medium();
                  router.push("/question/new");
                }}
              />
            )
          }
          renderItem={renderItem}
        />
        </View>
      </View>
    </SafeAreaView>
  );
}

function HeaderBar({ profile }: { profile: Profile | null }) {
  const router = useRouter();

  return (
    <View className="w-full items-center border-b border-white/[0.08] bg-surface/95 backdrop-blur-md z-10">
      <View className="w-full max-w-[720px] flex-row items-center justify-between px-5 pt-3 pb-3">
        <View className="flex-row items-center space-x-3">
          <View className="w-10 h-10 rounded-xl bg-primary-container/40 border border-primary/40 items-center justify-center shadow-md shadow-primary/25">
            <Logo variant="simple" size="sm" width={22} height={22} />
          </View>
          <View>
            <Typography variant="headline-md" className="text-on-surface leading-tight font-bold tracking-tight">
              EduCard
            </Typography>
            <Typography variant="label-sm" className="text-on-surface-variant/70 text-[12px]">
              Student Knowledge Network
            </Typography>
          </View>
        </View>

        <View className="flex-row items-center space-x-2.5">
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Search"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            onPress={() => {
              AppHaptics.light();
              router.push("/search" as any);
            }}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-surface-container-high/80 items-center justify-center border border-white/[0.08] web:hover:border-white/[0.18] active:bg-surface-container-highest web:cursor-pointer select-none active:scale-95 transition-all"
          >
            <Search size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Your profile"
            accessibilityHint="Opens your profile"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            onPress={() => {
              AppHaptics.light();
              router.push("/(tabs)/profile" as any);
            }}
            className="w-11 h-11 min-w-[44px] min-h-[44px] items-center justify-center web:cursor-pointer select-none active:scale-95 transition-transform"
          >
            <Avatar
              name={profile?.display_name || "User"}
              uri={profile?.avatar_path}
              size="sm"
              role={profile?.current_status || "undergraduate"}
              isVerified={profile?.is_verified}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

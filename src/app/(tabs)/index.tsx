import React, { useCallback } from "react";
import {
  View,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Typography } from "@/components/ui/Typography";
import { FlashList } from "@shopify/flash-list";
import {
  QuestionCard,
  QuestionCardData,
} from "@/components/domain/QuestionCard";
import { PostCard, PostCardData } from "@/components/domain/PostCard";
import { QuestionCardSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import {
  QuestionsService,
  FeedRow,
} from "@/services/questions";
import { queryKeys } from "@/lib/query-client";
import { useUIStore, FeedFilter as UIFeedFilter } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { AppHaptics } from "@/lib/haptics";
import { Search, Sparkles } from "lucide-react-native";

const PAGE_SIZE = 20;

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
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
      const last = lastPage[lastPage.length - 1];
      return {
        cursorCreatedAt: last.created_at,
        cursorId: last.id,
      };
    },
  });

  const questions = React.useMemo(
    () => (data?.pages.flat() ?? []) as FeedRow[],
    [data]
  );

  // Optimistic helpful reaction across every cached page.
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
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.feed(activeFeedFilter), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feed(activeFeedFilter) });
    },
  });

  const FILTERS = [
    { label: "For You", value: "all" },
    { label: "Unsolved", value: "unsolved" },
    { label: "Following", value: "following" },
    { label: "Campus", value: "university" },
  ] as const;

  const renderItem = useCallback(
    ({ item }: { item: FeedRow }) =>
      item.item_type === "post" ? (
        <PostCard
          post={feedRowToPost(item)}
          onPress={() => router.push(`/post/${item.id}` as any)}
          onHelpfulPress={(id) => {
            // Non-idempotent toggle — ignore taps while one is in flight.
            if (reactionMutation.isPending) return;
            const row = questions.find((q) => q.id === id && q.item_type === "post");
            if (row) reactionMutation.mutate(row);
          }}
        />
      ) : (
        <QuestionCard
          question={feedRowToQuestion(item)}
          onPress={() => router.push(`/question/${item.id}`)}
          onHelpfulPress={(id) => {
            if (reactionMutation.isPending) return;
            const row = questions.find((q) => q.id === id && q.item_type === "question");
            if (row) reactionMutation.mutate(row);
          }}
        />
      ),
    [questions, reactionMutation, router]
  );

  if (isError && questions.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <HeaderBar profileName={profile?.display_name} avatarUri={profile?.avatar_path} />
        <ErrorState
          title="Couldn't load your feed"
          message="We had trouble reaching the network. Check your connection and try again."
          errorCode="FEED_LOAD_FAILED"
          onRetry={() => refetch()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <HeaderBar profileName={profile?.display_name} avatarUri={profile?.avatar_path} />

      {/* Apple-Style Segmented Control Filter */}
      <View className="px-5 pt-3 pb-2">
        <View className="flex-row bg-surface-container-low p-1 rounded-2xl border border-white/[0.06]">
          {FILTERS.map((f) => {
            const isActive = activeFeedFilter === (f.value as UIFeedFilter);
            return (
              <TouchableOpacity
                key={f.value}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`Feed filter: ${f.label}`}
                onPress={() => {
                  AppHaptics.selection();
                  setActiveFeedFilter(f.value as UIFeedFilter);
                }}
                className={`flex-1 py-2 rounded-xl items-center justify-center transition-all ${
                  isActive
                    ? "bg-surface-container-high border border-white/[0.08] shadow-sm shadow-black/30"
                    : "border border-transparent"
                }`}
              >
                <Typography
                  variant="label-md"
                  className={
                    isActive ? "text-primary font-bold" : "text-on-surface-variant font-medium"
                  }
                >
                  {f.label}
                </Typography>
              </TouchableOpacity>
            );
          })}
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
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-3">
                <QuestionCardSkeleton />
              </View>
            ) : isError && questions.length > 0 ? (
              // Mid-scroll failure: keep the loaded rows visible, but surface
              // the problem instead of silently showing stale data forever.
              <TouchableOpacity onPress={() => refetch()} accessibilityRole="button" accessibilityLabel="Retry loading more feed items">
                <View className="mx-1 my-3 p-4 rounded-xl bg-error-container/30 border border-error/40 items-center">
                  <Typography variant="label-sm" className="text-on-surface-variant text-center normal-case">
                    Couldn't load newer content. Tap to retry.
                  </Typography>
                </View>
              </TouchableOpacity>
            ) : null
          }
          ListHeaderComponent={
            <View className="mb-2">
              {/* Quick Ask Prompt Card */}
              <Card
                onPress={() => {
                  AppHaptics.light();
                  router.push("/question/new");
                }}
                className="p-4 mb-4 bg-surface-container border border-outline-variant/60 flex-row items-center space-x-3.5 shadow-sm"
              >
                <Avatar
                  name={profile?.display_name || "Scholar"}
                  uri={profile?.avatar_path}
                  size="sm"
                  role={profile?.current_status || "undergraduate"}
                  isVerified={profile?.is_verified}
                />
                <View className="flex-1">
                  <Typography variant="body-md" className="text-on-surface-variant/80">
                    What are you trying to solve?
                  </Typography>
                </View>
                <Button
                  variant="primary"
                  size="sm"
                  onPress={() => {
                    // Haptics handled by Button for primary variant.
                    router.push("/question/new");
                  }}
                  className="px-4 py-1.5"
                >
                  Ask
                </Button>
              </Card>
            </View>
          }
          ListEmptyComponent={
            isLoading ? (
              <View className="space-y-4">
                <QuestionCardSkeleton />
                <QuestionCardSkeleton />
                <QuestionCardSkeleton />
              </View>
            ) : (
              <Card className="p-8 items-center justify-center my-6 bg-surface-container border border-outline-variant/60 shadow-lg shadow-black/30">
                <View className="w-16 h-16 rounded-2xl bg-primary-container/30 border border-primary/30 items-center justify-center mb-4 shadow-sm shadow-primary/20">
                  <Sparkles size={32} color="#818CF8" />
                </View>
                <Typography variant="headline-md" className="text-lg text-on-surface text-center mb-1.5 font-bold">
                  No inquiries in this feed yet
                </Typography>
                <Typography variant="body-md" className="text-on-surface-variant text-center max-w-[280px] mb-6 leading-relaxed">
                  Be the first scholar to ask a question or explore our campus communities.
                </Typography>
                <Button
                  variant="primary"
                  size="md"
                  onPress={() => {
                    AppHaptics.medium();
                    router.push("/question/new");
                  }}
                >
                  Ask a Question
                </Button>
              </Card>
            )
          }
          renderItem={renderItem}
        />
        </View>
      </View>
    </SafeAreaView>
  );
}

function HeaderBar({
  profileName,
  avatarUri,
}: {
  profileName?: string | null;
  avatarUri?: string | null;
}) {
  const router = useRouter();
  const { profile } = useAuthStore();

  return (
    <View className="flex-row items-center justify-between px-5 pt-3 pb-3 border-b border-surface-container-high/80">
      <View className="flex-row items-center space-x-3">
        <View className="w-10 h-10 rounded-xl bg-primary-container/40 border border-primary/30 items-center justify-center shadow-sm shadow-primary/20">
          <Logo variant="simple" size="sm" width={22} height={22} />
        </View>
        <View>
          <Typography variant="headline-md" className="text-on-surface leading-tight font-bold">
            EduCard
          </Typography>
          <Typography variant="label-sm" className="text-on-surface-variant/70 normal-case">
            Academic Intelligence Network
          </Typography>
        </View>
      </View>

      <View className="flex-row items-center space-x-2.5">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Search"
          onPress={() => {
            AppHaptics.light();
            router.push("/search" as any);
          }}
          className="w-10 h-10 rounded-xl bg-surface-container items-center justify-center border border-outline-variant/60 active:bg-surface-container-high"
        >
          <Search size={18} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Your profile"
          accessibilityHint="Opens your scholar profile"
          onPress={() => {
            AppHaptics.light();
            router.push("/(tabs)/profile" as any);
          }}
        >
          <Avatar
            name={profileName || profile?.display_name || "Scholar"}
            uri={avatarUri ?? profile?.avatar_path}
            size="sm"
            role={profile?.current_status || "undergraduate"}
            isVerified={profile?.is_verified}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

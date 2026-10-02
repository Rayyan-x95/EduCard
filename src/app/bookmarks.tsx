import React, { useState, useMemo } from "react";
import { View, TouchableOpacity, RefreshControl, Alert, Modal, ScrollView } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { QuestionCard } from "@/components/domain/QuestionCard";
import { PostCard } from "@/components/domain/PostCard";
import {
  BookmarksService,
  BookmarkItem,
  BookmarksCursor,
} from "@/services/bookmarks";
import { queryKeys } from "@/lib/query-client";
import { useAuthStore } from "@/stores/authStore";
import { useSmartBack } from "@/hooks/useSmartBack";
import { AppHaptics } from "@/lib/haptics";
import { Analytics } from "@/lib/analytics";
import { normalizeError } from "@/lib/errors";
import {
  ArrowLeft,
  Bookmark,
  Trash2,
  Sparkles,
  CheckCircle2,
  X,
  BookOpen,
} from "lucide-react-native";

const TABS = [
  { label: "Questions", value: "questions" },
  { label: "Discussions", value: "posts" },
] as const;

type BookmarkTab = "questions" | "posts";

export default function BookmarksScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const handleBack = useSmartBack("/(tabs)");
  const [activeTab, setActiveTab] = useState<BookmarkTab>("questions");
  const [questionFilter, setQuestionFilter] = useState<"all" | "solved" | "open">("all");

  // Study Mode state
  const [isStudyModeOpen, setIsStudyModeOpen] = useState(false);
  const [studyIndex, setStudyIndex] = useState(0);

  const targetType = activeTab === "posts" ? "post" : "question";

  // In-flight removals so cards can show immediate feedback.
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const removeMutation = useMutation({
    mutationFn: (bm: BookmarkItem) => {
      if (!user?.id) {
        throw Object.assign(new Error("Please sign in first."), { code: "APP_ERROR" });
      }
      return BookmarksService.toggleBookmark(
        bm.item_type,
        bm.id,
        user.id
      );
    },
    onSuccess: (_result, bm) => {
      AppHaptics.success();
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks("question") });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks("post") });
    },
    onError: (err) => {
      Alert.alert("Couldn't remove", normalizeError(err).message);
    },
    onSettled: (_d, _e, bm) => {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        if (bm) next.delete(bm.bookmark_id);
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
  const bookmarks = useMemo(() => data?.pages.flat() ?? [], [data]);

  const studyDeck = useMemo(() => {
    return bookmarks.filter((b) => b.item_type === "question");
  }, [bookmarks]);

  const filteredBookmarks = useMemo(() => {
    if (activeTab !== "questions" || questionFilter === "all") {
      return bookmarks;
    }
    if (questionFilter === "solved") {
      return bookmarks.filter((b) => b.status === "solved");
    }
    return bookmarks.filter((b) => b.status === "open");
  }, [bookmarks, activeTab, questionFilter]);

  const hasBookmarks = filteredBookmarks.length > 0;

  const listItems = useMemo(() => {
    const items: any[] = [];
    items.push({ type: "header" });
    items.push({ type: "tabs" });

    if (isLoading) {
      items.push({ type: "loading" });
    } else if (isError) {
      items.push({ type: "error" });
    } else if (hasBookmarks) {
      filteredBookmarks.forEach((bm) => items.push({ type: "bookmark", data: bm }));
      if (hasNextPage) {
        items.push({ type: "load_more" });
      }
    } else {
      items.push({ type: "empty_state" });
    }
    return items;
  }, [isLoading, isError, hasBookmarks, filteredBookmarks, hasNextPage]);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="px-5 py-3 border-b border-surface-container-high/80 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-surface-container items-center justify-center border border-outline-variant/60 mr-3 active:bg-surface-container-high web:cursor-pointer select-none active:scale-95 transition-transform"
          >
            <ArrowLeft size={20} color="#F8FAFC" />
          </TouchableOpacity>
          <Typography variant="label-lg" className="text-on-surface font-bold">
            Saved Library
          </Typography>
        </View>

        {activeTab === "questions" && studyDeck.length > 0 && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Launch Study Mode"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            onPress={() => {
              AppHaptics.medium();
              setStudyIndex(0);
              setIsStudyModeOpen(true);
              Analytics.track("study_mode_entered", { count: studyDeck.length });
            }}
            className="flex-row items-center gap-x-1.5 px-3.5 py-2 min-h-[44px] rounded-xl bg-primary-container/40 border border-primary/40 active:bg-primary-container/60 web:cursor-pointer select-none active:scale-95 transition-transform"
          >
            <Sparkles size={14} color="#818CF8" />
            <Typography variant="label-sm" className="text-primary font-bold">
              Study Mode
            </Typography>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ flex: 1, width: "100%" }}>
        <FlashList<any>
          data={listItems}
          getItemType={(item) => item.type}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#818CF8"
            />
          }
          renderItem={({ item }) => {
            if (item.type === "header") {
              return (
                <View>
                  <Typography variant="headline-lg" className="text-on-surface mb-1 font-bold text-2xl">
                    Bookmarks & Collections
                  </Typography>
                  <Typography variant="body-md" className="text-on-surface-variant mb-5 leading-relaxed">
                    Your saved intellectual assets, curated for deep reading, study sessions, and research.
                  </Typography>
                </View>
              );
            }

            if (item.type === "tabs") {
              return (
                <View className="mb-6">
                  <SegmentedControl
                    options={TABS}
                    value={activeTab}
                    onChange={setActiveTab}
                  />

                  {activeTab === "questions" && (
                    <View className="flex-row items-center mt-3">
                      {(["all", "solved", "open"] as const).map((filter) => {
                        const isSelected = questionFilter === filter;
                        const label =
                          filter === "all"
                            ? "All Questions"
                            : filter === "solved"
                            ? "Verified Solutions"
                            : "Unsolved";
                        return (
                          <TouchableOpacity
                            key={filter}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isSelected }}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            onPress={() => {
                              AppHaptics.selection();
                              setQuestionFilter(filter);
                            }}
                            className={`px-3.5 py-2 min-h-[38px] rounded-full border web:cursor-pointer select-none active:scale-95 transition-transform mr-2 ${
                              isSelected
                                ? "bg-primary-container/60 border-primary shadow-sm shadow-primary/20"
                                : "bg-surface-container border-outline-variant/60 active:bg-surface-container-high"
                            }`}
                          >
                            <Typography
                              variant="label-sm"
                              className={
                                isSelected
                                  ? "text-primary font-bold normal-case text-xs"
                                  : "text-on-surface-variant font-medium normal-case text-xs"
                              }
                            >
                              {label}
                            </Typography>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            }

            if (item.type === "loading") {
              return (
                <View>
                  <View className="mb-4"><Skeleton height={140} className="w-full rounded-2xl bg-surface-container" /></View>
                  <View><Skeleton height={140} className="w-full rounded-2xl bg-surface-container" /></View>
                </View>
              );
            }

            if (item.type === "error") {
              return (
                <ErrorState
                  title="Couldn't load bookmarks"
                  message="We couldn't reach the network while loading your saved items. Check your connection and try again."
                  onRetry={refetch}
                />
              );
            }

            if (item.type === "bookmark") {
              const bm = item.data;
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
                <View className="relative mb-4">
                  {card}
                  {/* Quick-remove button */}
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
            }

            if (item.type === "load_more") {
              return (
                <Button
                  variant="outline"
                  size="md"
                  loading={isFetchingNextPage}
                  onPress={() => {
                    AppHaptics.light();
                    fetchNextPage();
                  }}
                  className="mt-2"
                >
                  Load more
                </Button>
              );
            }

            if (item.type === "empty_state") {
              return (
                <View className="flex-1 items-center justify-center py-12">
                  <EmptyState
                    icon={<Bookmark size={32} color="#818CF8" />}
                    title="No bookmarks yet"
                    description="Your reading list is currently empty. Save insightful questions and key resources to build your personal knowledge base."
                    actionLabel="Explore Content"
                    onAction={() => {
                      AppHaptics.medium();
                      router.push("/(tabs)" as any);
                    }}
                  />
                </View>
              );
            }
            return null;
          }}
        />
      </View>

      {/* Study Mode Full-Screen Review Modal */}
      <Modal
        visible={isStudyModeOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsStudyModeOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-surface">
          {/* Study Mode Header */}
          <View className="px-5 py-3 border-b border-surface-container-high/80 flex-row items-center justify-between">
            <View className="flex-row items-center gap-x-2">
              <View className="w-8 h-8 rounded-lg bg-primary-container/40 items-center justify-center">
                <BookOpen size={16} color="#818CF8" />
              </View>
              <Typography variant="label-lg" className="text-on-surface font-bold">
                Study Review
              </Typography>
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Close Study Mode"
              onPress={() => {
                AppHaptics.light();
                setIsStudyModeOpen(false);
              }}
              className="w-10 h-10 rounded-xl bg-surface-container items-center justify-center border border-outline-variant/60 active:bg-surface-container-high"
            >
              <X size={18} color="#F8FAFC" />
            </TouchableOpacity>
          </View>

          {studyDeck.length > 0 ? (
            <ScrollView className="flex-1 px-5 pt-6 pb-8" contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between" }}>
              <View>
                {/* Progress Indicator */}
                <View className="flex-row items-center justify-between mb-4">
                  <Typography variant="label-sm" className="text-primary font-bold">
                    Card {studyIndex + 1} of {studyDeck.length}
                  </Typography>
                  {studyDeck[studyIndex]?.status === "solved" && (
                    <View className="flex-row items-center gap-x-1 px-2.5 py-1 rounded-full bg-tertiary-container/30 border border-tertiary/40">
                      <CheckCircle2 size={12} color="#34D399" />
                      <Typography variant="label-sm" className="text-tertiary font-bold text-xs normal-case">
                        Verified Solution
                      </Typography>
                    </View>
                  )}
                </View>

                {/* Question Card */}
                <Card className="p-5 mb-4 bg-surface-container border border-outline-variant/60 shadow-md">
                  <Typography variant="headline-md" className="text-on-surface font-bold mb-3 leading-snug">
                    {studyDeck[studyIndex]?.title}
                  </Typography>
                  <Typography variant="body-md" className="text-on-surface-variant leading-relaxed">
                    {studyDeck[studyIndex]?.body}
                  </Typography>
                </Card>

                {/* View Full Discussion / Solution Action */}
                <Button
                  variant="outline"
                  size="md"
                  onPress={() => {
                    AppHaptics.light();
                    const currentId = studyDeck[studyIndex]?.id;
                    setIsStudyModeOpen(false);
                    if (currentId) router.push(`/question/${currentId}` as any);
                  }}
                  className="mb-4"
                >
                  Inspect Full Answers & Discussion
                </Button>
              </View>

              {/* Navigation Controls */}
              <View className="flex-row items-center justify-between pt-4 border-t border-surface-container-high/80">
                <Button
                  variant="secondary"
                  size="md"
                  disabled={studyIndex === 0}
                  onPress={() => {
                    AppHaptics.selection();
                    setStudyIndex((prev) => Math.max(0, prev - 1));
                  }}
                  className="flex-1 mr-2"
                >
                  Previous
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  disabled={studyIndex >= studyDeck.length - 1}
                  onPress={() => {
                    AppHaptics.selection();
                    setStudyIndex((prev) => Math.min(studyDeck.length - 1, prev + 1));
                  }}
                  className="flex-1 ml-2"
                >
                  Next Card
                </Button>
              </View>
            </ScrollView>
          ) : (
            <View className="flex-1 items-center justify-center p-6">
              <Typography variant="body-md" className="text-on-surface-variant text-center">
                No question bookmarks available for study mode.
              </Typography>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

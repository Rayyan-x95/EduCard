import React from "react";
import { View, TouchableOpacity, RefreshControl, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Typography } from "@/components/ui/Typography";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { FlashList } from "@shopify/flash-list";
import { Bell, CheckCircle2, MessageSquare, CheckCheck, UserPlus, ThumbsUp } from "lucide-react-native";
import {
  NotificationsService,
  GroupedNotification,
  groupNotifications,
  NOTIFICATION_TYPES,
} from "@/services/notifications";
import { useAuthStore } from "@/stores/authStore";
import { queryKeys } from "@/lib/query-client";
import { AppHaptics } from "@/lib/haptics";
import { formatDate } from "@/lib/date";

function describe(item: GroupedNotification) {
  const count = item.count;
  const firstActor = item.actors[0]?.display_name || "Someone";
  const othersCount = count - 1;
  const actorText =
    othersCount > 0
      ? `${firstActor} and ${othersCount === 1 ? "1 other" : `${othersCount} others`}`
      : firstActor;

  switch (item.type) {
    case NOTIFICATION_TYPES.ANSWER_ACCEPTED:
      return {
        title: "Solution Accepted",
        body: `${firstActor} marked your answer as the accepted solution (+15 Rep).`,
        tone: "accepted" as const,
      };
    case NOTIFICATION_TYPES.ANSWER_CREATED:
      return {
        title: count > 1 ? "New Answers" : "New Answer",
        body: `${actorText} answered your question.`,
        tone: "answer" as const,
      };
    case NOTIFICATION_TYPES.FOLLOW:
      return {
        title: count > 1 ? "New Followers" : "New Follower",
        body: `${actorText} started following you.`,
        tone: "follow" as const,
      };
    case "helpful_voted":
      return {
        title: "Reputation Boost",
        body: `${actorText} marked your answer as helpful (+${count * 5} Rep).`,
        tone: "helpful" as const,
      };
    case "comment_created":
      return {
        title: count > 1 ? "New Comments" : "New Comment",
        body: `${actorText} commented on your post.`,
        tone: "comment" as const,
      };
    default:
      return {
        title: count > 1 ? "Notifications" : "Notification",
        body: count > 1 ? `You have ${count} new updates.` : "You have a new update.",
        tone: "generic" as const,
      };
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  // NOTE: realtime updates are handled by the ROOT-level
  // useRealtimeNotifications subscription (src/app/_layout.tsx). Subscribing
  // here as well would attach to the SAME channel name and this screen's
  // unmount cleanup would destroy the global listener.

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
    queryKey: queryKeys.notifications(),
    queryFn: ({ pageParam }) => NotificationsService.getNotifications(pageParam, user?.id),
    initialPageParam: null as { createdAt: string; id: string } | null,
    getNextPageParam: (lastPage) =>
      NotificationsService.nextNotificationCursor(lastPage) ?? undefined,
    enabled: Boolean(user?.id),
  });

  const notifications = React.useMemo(
    () => groupNotifications(data?.pages.flat() ?? []),
    [data]
  );

  const markAllMutation = useMutation({
    mutationFn: () => {
      if (!user?.id) {
        throw Object.assign(new Error("Authentication required"), { code: "APP_ERROR" });
      }
      return NotificationsService.markAllAsRead(user.id);
    },
    onSuccess: () => {
      AppHaptics.success();
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadNotificationsCount() });
    },
  });

  const handleNotificationPress = async (item: GroupedNotification) => {
    AppHaptics.light();
    if (!item.read_at && item.ids.length > 0) {
      try {
        await NotificationsService.markMultipleAsRead(item.ids);
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
        queryClient.invalidateQueries({ queryKey: queryKeys.unreadNotificationsCount() });
      } catch {
        // Read-state sync is best-effort; navigation still proceeds.
      }
    }

    if (item.entity_type === "question") {
      router.push(`/question/${item.entity_id}` as any);
    } else if (item.entity_type === "post") {
      router.push(`/post/${item.entity_id}` as any);
    } else if (item.entity_type === "community") {
      router.push(`/community/${item.entity_id}` as any);
    } else if (item.entity_type === "profile") {
      // Follow notifications carry the actor's profile id as entity_id.
      router.push(`/user/${item.entity_id}` as any);
    }
  };

  // Server-computed count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: queryKeys.unreadNotificationsCount(),
    queryFn: () => NotificationsService.getUnreadCount(),
    enabled: Boolean(user?.id),
  });

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 w-full max-w-2xl mx-auto">
        {/* Top Header */}
        <View className="flex-row items-center justify-between px-5 pt-3 pb-3 border-b border-surface-container-high/80">
        <View className="flex-1 mr-3">
          <Typography variant="headline-md" className="text-on-surface font-bold">
            Alerts
          </Typography>
          <Typography variant="body-sm" className="text-on-surface-variant/80">
            Answers, replies, and activity updates
          </Typography>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Mark ${unreadCount} notifications as read`}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            onPress={() => markAllMutation.mutate()}
            className="flex-row items-center px-3.5 py-2.5 min-h-[44px] rounded-xl bg-surface-container border border-outline-variant/60 active:bg-surface-container-high web:cursor-pointer select-none active:scale-95 transition-transform"
          >
            <View className="mr-1.5"><CheckCheck size={15} color="#818CF8" /></View>
            <Typography variant="label-sm" className="text-primary font-bold">
              Mark all read
            </Typography>
          </TouchableOpacity>
        )}
      </View>

      {isError ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#818CF8" />
          }
        >
          <ErrorState
            title="Couldn't load alerts"
            message="Please check your connection and pull down or tap retry."
            errorCode="NOTIFICATIONS_LOAD_FAILED"
            onRetry={refetch}
          />
        </ScrollView>
      ) : isLoading ? (
        <View className="p-5">
          <View className="mb-3.5"><Skeleton height={80} className="w-full rounded-2xl bg-surface-container" /></View>
          <View className="mb-3.5"><Skeleton height={80} className="w-full rounded-2xl bg-surface-container" /></View>
          <View><Skeleton height={80} className="w-full rounded-2xl bg-surface-container" /></View>
        </View>
      ) : notifications.length > 0 ? (
        <FlashList<GroupedNotification>
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#818CF8" />
          }
          renderItem={({ item }) => {
            const { title, body, tone } = describe(item);
            const isUnread = !item.read_at;

            return (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`${title}: ${body}`}
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.8}
              >
                <Card
                  className={`mb-3 p-4 border ${
                    isUnread
                      ? tone === "accepted"
                        ? "bg-tertiary-container/15 border-tertiary/40"
                        : "bg-surface-container border-primary/40 shadow-sm shadow-primary/10"
                      : "bg-surface-container-low border-outline-variant/40 opacity-80"
                  }`}
                >
                  <View className="flex-row items-start">
                    <View
                      className={`w-10 h-10 rounded-xl items-center justify-center mr-3.5 ${
                        tone === "accepted"
                          ? "bg-tertiary-container/50 border border-tertiary/50"
                          : tone === "follow"
                          ? "bg-secondary-container/40 border border-secondary/50"
                          : tone === "helpful"
                          ? "bg-secondary-container/30 border border-secondary/40"
                          : "bg-primary-container/50 border border-primary/50"
                      }`}
                    >
                      {tone === "accepted" ? (
                        <CheckCircle2 size={18} color="#34D399" />
                      ) : tone === "follow" ? (
                        <UserPlus size={16} color="#C084FC" />
                      ) : tone === "helpful" ? (
                        <ThumbsUp size={16} color="#C084FC" />
                      ) : (
                        <MessageSquare size={16} color="#818CF8" />
                      )}
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1">
                        <View className="flex-row items-center flex-1 mr-2">
                          {isUnread && (
                            <View className="w-2 h-2 rounded-full bg-primary mr-1.5 shadow-sm shadow-primary" />
                          )}
                          <Typography variant="label-md" className="text-on-surface font-bold mr-1.5">
                            {title}
                          </Typography>
                          {item.count > 1 && (
                            <View className="px-1.5 py-0.5 rounded-full bg-primary/20 border border-primary/40">
                              <Typography variant="label-sm" className="text-primary text-[10px] font-bold">
                                ×{item.count}
                              </Typography>
                            </View>
                          )}
                        </View>
                        <Typography variant="label-sm" className="text-on-surface-variant/60 font-medium">
                          {formatDate(item.created_at)}
                        </Typography>
                      </View>
                      <Typography variant="body-sm" className="text-on-surface-variant/90 leading-relaxed">
                        {body}
                      </Typography>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        /* Empty State with pull-to-refresh */
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 20 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#818CF8" />
          }
        >
          <EmptyState
            icon={<Bell size={32} color="#818CF8" />}
            title="You're all caught up!"
            description="No new alerts yet. Check back later for updates on your questions."
            actionLabel="Explore Spaces"
            onAction={() => {
              AppHaptics.medium();
              router.push("/(tabs)/communities" as any);
            }}
          />
        </ScrollView>
      )}
      </View>
    </SafeAreaView>
  );
}

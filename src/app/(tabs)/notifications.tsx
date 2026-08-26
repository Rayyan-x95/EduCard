import React from "react";
import { View, TouchableOpacity, RefreshControl, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Typography } from "@/components/ui/Typography";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { FlashList } from "@shopify/flash-list";
import { Bell, Compass, CheckCircle2, MessageSquare, CheckCheck, UserPlus } from "lucide-react-native";
import {
  NotificationsService,
  NotificationRecord,
  NOTIFICATION_TYPES,
} from "@/services/notifications";
import { useAuthStore } from "@/stores/authStore";
import { queryKeys } from "@/lib/query-client";
import { AppHaptics } from "@/lib/haptics";

function describe(item: NotificationRecord, actorName: string) {
  switch (item.type) {
    case NOTIFICATION_TYPES.ANSWER_ACCEPTED:
      return {
        title: "Solution Accepted",
        body: `${actorName} marked your answer as the accepted solution (+15 Rep).`,
        tone: "accepted" as const,
      };
    case NOTIFICATION_TYPES.ANSWER_CREATED:
      return {
        title: "New Scholarly Answer",
        body: `${actorName} contributed an answer to your inquiry.`,
        tone: "answer" as const,
      };
    case NOTIFICATION_TYPES.FOLLOW:
      return {
        title: "New Follower",
        body: `${actorName} is now following your work.`,
        tone: "follow" as const,
      };
    default:
      return {
        title: "Academic Update",
        body: "You have a new update.",
        tone: "generic" as const,
      };
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

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
    () => data?.pages.flat() ?? [],
    [data]
  );

  const markAllMutation = useMutation({
    mutationFn: () => NotificationsService.markAllAsRead(user!.id!),
    onSuccess: () => {
      AppHaptics.success();
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const handleNotificationPress = async (item: NotificationRecord) => {
    AppHaptics.light();
    if (!item.read_at && item.id) {
      try {
        await NotificationsService.markAsRead(item.id);
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      } catch {
        // Read-state sync is best-effort; navigation still proceeds.
      }
    }

    if (item.entity_type === "question") {
      router.push(`/question/${item.entity_id}` as any);
    } else if (item.entity_type === "profile") {
      // Follow notifications carry the actor's profile id as entity_id.
      router.push(`/user/${item.entity_id}` as any);
    }
  };

  // Server-computed count (keyed under ["notifications", …] so every
  // invalidateQueries({ queryKey: ["notifications"] }) — realtime inserts,
  // mark-as-read, mark-all — also refreshes it). The old client-side
  // filter only saw loaded pages and undercounted beyond page one.
  const { data: unreadCount = 0 } = useQuery({
    queryKey: queryKeys.unreadNotificationsCount(),
    queryFn: () => NotificationsService.getUnreadCount(),
    enabled: Boolean(user?.id),
  });

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-3 border-b border-surface-container-high/80">
        <View className="flex-1 mr-3">
          <Typography variant="headline-md" className="text-on-surface font-bold">
            Alerts
          </Typography>
          <Typography variant="body-sm" className="text-on-surface-variant/80">
            Academic alerts and verified solutions
          </Typography>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Mark ${unreadCount} notifications as read`}
            onPress={() => markAllMutation.mutate()}
            className="flex-row items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant/60 active:bg-surface-container-high"
          >
            <CheckCheck size={15} color="#818CF8" />
            <Typography variant="label-sm" className="text-primary font-bold normal-case">
              Mark all read
            </Typography>
          </TouchableOpacity>
        )}
      </View>

      {isError ? (
        <ErrorState
          title="Couldn't load alerts"
          message="Please check your connection and try again."
          errorCode="NOTIFICATIONS_LOAD_FAILED"
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <View className="p-5 space-y-3.5">
          <Skeleton height={80} className="w-full rounded-2xl bg-surface-container" />
          <Skeleton height={80} className="w-full rounded-2xl bg-surface-container" />
          <Skeleton height={80} className="w-full rounded-2xl bg-surface-container" />
        </View>
      ) : notifications.length > 0 ? (
        <FlashList<NotificationRecord>
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
            const actorName = item.actor?.display_name || "A scholar";
            const { title, body, tone } = describe(item, actorName);
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
                  <View className="flex-row items-start space-x-3.5">
                    <View
                      className={`w-10 h-10 rounded-xl items-center justify-center ${
                        tone === "accepted"
                          ? "bg-tertiary-container/50 border border-tertiary/50"
                          : tone === "follow"
                          ? "bg-secondary-container/40 border border-secondary/50"
                          : "bg-primary-container/50 border border-primary/50"
                      }`}
                    >
                      {tone === "accepted" ? (
                        <CheckCircle2 size={18} color="#34D399" />
                      ) : tone === "follow" ? (
                        <UserPlus size={16} color="#C084FC" />
                      ) : (
                        <MessageSquare size={16} color="#818CF8" />
                      )}
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1">
                        <Typography variant="label-md" className="text-on-surface font-bold">
                          {title}
                        </Typography>
                        <Typography variant="label-sm" className="text-on-surface-variant/60 font-medium normal-case">
                          {new Date(item.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </Typography>
                      </View>
                      <Typography variant="body-sm" className="text-on-surface-variant/90 leading-relaxed">
                        {body}
                      </Typography>
                    </View>

                    {isUnread && (
                      <View className="w-2 h-2 rounded-full bg-primary mt-1.5 shadow-sm shadow-primary" />
                    )}
                  </View>
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        /* Empty State */
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center" }}
          className="px-6 py-12"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#818CF8" />
          }
        >
          <View className="w-20 h-20 rounded-2xl bg-surface-container-high border border-outline-variant/60 items-center justify-center mb-6 shadow-sm">
            <Bell size={36} color="#818CF8" />
          </View>

          <Typography variant="headline-md" className="text-on-surface text-center mb-2 font-bold">
            You're all caught up!
          </Typography>
          <Typography variant="body-md" className="text-on-surface-variant text-center max-w-xs mb-8 leading-relaxed">
            No new alerts yet. Check back later for updates on your questions.
          </Typography>

          <Button
            variant="primary"
            size="lg"
            leftIcon={<Compass size={18} color="#0F172A" />}
            onPress={() => {
              AppHaptics.medium();
              router.push("/(tabs)/communities" as any);
            }}
          >
            Explore Spaces
          </Button>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

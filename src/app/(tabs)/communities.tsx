import React from "react";
import { View, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Typography } from "@/components/ui/Typography";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { FlashList } from "@shopify/flash-list";
import { CommunitiesService, CommunityRow } from "@/services/communities";
import { queryKeys, CACHE_TTL } from "@/lib/query-client";
import { AppHaptics } from "@/lib/haptics";
import { Users, Compass, Plus, ChevronRight } from "lucide-react-native";

export default function CommunitiesScreen() {
  const router = useRouter();

  const {
    data: communities = [],
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: queryKeys.communities(),
    queryFn: () => CommunitiesService.listCommunities(),
    staleTime: CACHE_TTL.COMMUNITIES,
  });

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 w-full max-w-2xl mx-auto">
        <View className="px-5 pt-3 pb-3 border-b border-surface-container-high/80 flex-row items-center justify-between">
          <View className="flex-1 mr-3">
            <Typography variant="headline-md" className="text-on-surface font-bold">
              Communities
            </Typography>
            <Typography variant="body-sm" className="text-on-surface-variant/80">
              Study groups, clubs, and campus discussions
            </Typography>
          </View>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={16} color="#0F172A" />}
            onPress={() => {
              AppHaptics.medium();
              router.push("/community/new" as any);
            }}
            className="px-3.5"
          >
            Create
          </Button>
        </View>

        {isLoading ? (
          <View className="flex-1 px-5 py-4 space-y-4">
            <Skeleton height={140} className="w-full rounded-2xl bg-surface-container" />
            <Skeleton height={140} className="w-full rounded-2xl bg-surface-container" />
            <Skeleton height={140} className="w-full rounded-2xl bg-surface-container" />
          </View>
        ) : isError ? (
          <ErrorState
            title="Couldn't load communities"
            message="We couldn't reach the network while loading communities. Check your connection and try again."
            onRetry={refetch}
          />
        ) : communities.length > 0 ? (
          <View className="flex-1 px-5 pt-4">
            <FlashList<CommunityRow>
              data={communities}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 24 }}
              refreshControl={
                <RefreshControl
                  refreshing={isRefetching}
                  onRefresh={refetch}
                  tintColor="#818CF8"
                />
              }
              renderItem={({ item: comm }: { item: CommunityRow }) => (
                <Card
                  className="mb-4"
                  onPress={() => {
                    AppHaptics.light();
                    router.push(`/community/${comm.slug}` as any);
                  }}
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center space-x-3.5 flex-1 mr-2">
                      <View className="w-11 h-11 rounded-2xl bg-primary-container/40 border border-primary/30 items-center justify-center shadow-sm shadow-primary/20">
                        <Users size={20} color="#818CF8" />
                      </View>
                      <View className="flex-1">
                        <Typography variant="headline-sm" className="text-on-surface font-bold leading-snug">
                          {comm.name}
                        </Typography>
                        <Typography variant="label-sm" className="text-on-surface-variant/70 font-medium mt-1">
                          {(comm.member_count || 0).toLocaleString()} members
                        </Typography>
                      </View>
                    </View>
                    <ChevronRight size={18} color="#94A3B8" />
                  </View>

                  <Typography variant="body-md" className="text-on-surface-variant/90 leading-relaxed" numberOfLines={3}>
                    {comm.description}
                  </Typography>
                </Card>
              )}
            />
          </View>
        ) : (
          <View className="flex-1 items-center justify-center px-5 py-12">
            <EmptyState
              icon={<Compass size={32} color="#818CF8" />}
              title="No Communities Found"
              description="Discover questions and connect with peers on the feed."
              actionLabel="Explore Feed"
              onAction={() => {
                AppHaptics.medium();
                router.push("/(tabs)" as any);
              }}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

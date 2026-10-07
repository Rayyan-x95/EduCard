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
import { Compass, Plus, ChevronRight } from "lucide-react-native";

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
        <View className="px-5 py-3 border-b border-outline-variant flex-row items-center justify-between">
          <View className="flex-1 mr-3">
            <Typography variant="headline-md" className="text-on-surface font-headline font-bold text-2xl tracking-tight">
              Spaces & Guilds
            </Typography>
            <Typography variant="body-sm" className="text-on-surface-variant font-medium">
              Academic study groups, faculties, and collegiate discussions
            </Typography>
          </View>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={16} color="#181003" strokeWidth={2.4} />}
            onPress={() => {
              AppHaptics.medium();
              router.push("/community/new" as any);
            }}
            className="px-4 h-10 rounded-full"
          >
            Create
          </Button>
        </View>

        {isLoading ? (
          <View className="flex-1 px-5 py-4">
            <Skeleton height={130} className="w-full rounded-2xl bg-surface-container mb-4" />
            <Skeleton height={130} className="w-full rounded-2xl bg-surface-container mb-4" />
            <Skeleton height={130} className="w-full rounded-2xl bg-surface-container mb-4" />
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
              contentContainerStyle={{ paddingBottom: 110 }}
              refreshControl={
                <RefreshControl
                  refreshing={isRefetching}
                  onRefresh={refetch}
                  tintColor="#D49B35"
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
                    <View className="flex-row items-center flex-1 mr-2">
                      <View className="w-12 h-12 rounded-xl bg-primary-container border border-primary/40 items-center justify-center shadow-sm shadow-black/20 mr-3.5">
                        <Typography variant="label-md" className="text-primary-light font-headline font-bold text-[15px] tracking-wider uppercase">
                          {comm.name.slice(0, 2).toUpperCase()}
                        </Typography>
                      </View>
                      <View className="flex-1">
                        <Typography variant="headline-sm" className="text-on-surface font-headline font-bold text-lg tracking-tight leading-snug">
                          {comm.name}
                        </Typography>
                        <Typography variant="label-sm" className="text-on-surface-muted font-medium mt-0.5">
                          {(comm.member_count || 0).toLocaleString()} {comm.member_count === 1 ? "scholar" : "scholars"}
                        </Typography>
                      </View>
                    </View>
                    <ChevronRight size={18} color="#A3B3C4" />
                  </View>

                  <Typography variant="body-md" className="text-on-surface-variant leading-relaxed text-[14px]" numberOfLines={3}>
                    {comm.description}
                  </Typography>
                </Card>
              )}
            />
          </View>
        ) : (
          <View className="flex-1 items-center justify-center px-5 py-12">
            <EmptyState
              icon={<Compass size={32} color="#D49B35" />}
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

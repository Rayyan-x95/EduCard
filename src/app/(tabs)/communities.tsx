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
import { FlashList } from "@shopify/flash-list";
import { CommunitiesService } from "@/services/communities";
import { queryKeys } from "@/lib/query-client";
import { AppHaptics } from "@/lib/haptics";
import { Users, Compass, Plus } from "lucide-react-native";

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
  });

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="px-5 pt-3 pb-3 border-b border-surface-container-high/80 flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <Typography variant="headline-md" className="text-on-surface font-bold">
            Academic Spaces
          </Typography>
          <Typography variant="body-sm" className="text-on-surface-variant/80">
            Campus circles, alumni networks, and research labs
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
        // A failed fetch must never masquerade as "no spaces exist".
        <ErrorState
          title="Couldn't load Spaces"
          message="We couldn't reach the network while loading academic spaces. Check your connection and try again."
          onRetry={() => refetch()}
        />
      ) : communities.length > 0 ? (
        <View className="flex-1 px-5 pt-4">
          <FlashList
            data={communities}
            keyExtractor={(item: any) => item.id}

            contentContainerStyle={{ paddingBottom: 24 }}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor="#818CF8"
              />
            }
            renderItem={({ item: comm }: { item: any }) => (
              <Card
                className="mb-4"
                onPress={() => {
                  AppHaptics.light();
                  router.push(`/community/${comm.slug}` as any);
                }}
              >
                <View className="flex-row items-center space-x-3.5 mb-3">
                  <View className="w-11 h-11 rounded-2xl bg-primary-container/40 border border-primary/30 items-center justify-center shadow-sm shadow-primary/20">
                    <Users size={20} color="#818CF8" />
                  </View>
                  <View className="flex-1">
                    <Typography variant="headline-sm" className="text-on-surface font-bold leading-snug">
                      {comm.name}
                    </Typography>
                    <Typography variant="label-sm" className="text-on-surface-variant/70 normal-case font-medium mt-1">
                      {(comm.member_count || 0).toLocaleString()} members
                    </Typography>
                  </View>
                </View>

                <Typography variant="body-md" className="text-on-surface-variant/90 mb-4 leading-relaxed" numberOfLines={3}>
                  {comm.description}
                </Typography>

                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => {
                    AppHaptics.light();
                    router.push(`/community/${comm.slug}` as any);
                  }}
                >
                  Open Space
                </Button>
              </Card>
            )}
          />
        </View>
      ) : (
        <View className="flex-1 items-center justify-center px-5 py-12">
            <Card className="p-8 items-center text-center max-w-sm w-full bg-surface-container border border-outline-variant/60 shadow-lg shadow-black/30">
              <View className="w-16 h-16 rounded-2xl bg-primary-container/30 border border-primary/30 items-center justify-center mb-4 shadow-sm shadow-primary/20">
                <Compass size={32} color="#818CF8" />
              </View>
              <Typography variant="headline-md" className="text-on-surface text-center mb-1.5 font-bold">
                No Spaces Found
              </Typography><Typography variant="body-md" className="text-on-surface-variant text-center mb-6 leading-relaxed">
                Discover questions and connect with scholars on the main feed.
              </Typography>
              <Button
                variant="primary"
                size="md"
                onPress={() => {
                  AppHaptics.medium();
                  router.push("/(tabs)" as any);
                }}
              >
                Explore Feed
              </Button>
            </Card>
        </View>
      )}
    </SafeAreaView>
  );
}

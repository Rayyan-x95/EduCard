import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Typography } from "@/components/ui/Typography";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { CommunitiesService } from "@/services/communities";
import { ShareService } from "@/lib/sharing";
import { useAuthStore } from "@/stores/authStore";
import { normalizeError } from "@/lib/errors";
import { AppHaptics } from "@/lib/haptics";
import { Alert } from "react-native";
import {
  ArrowLeft,
  Shield,
  Users,
  UserCheck,
  UserPlus,
  Share2,
  MessageSquare,
} from "lucide-react-native";

export default function CommunityDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [actionError, setActionError] = useState("");

  const { data: community, isLoading, isError, refetch } = useQuery({
    queryKey: ["community", slug],
    queryFn: () => CommunitiesService.getCommunityBySlug(slug || ""),
    enabled: Boolean(slug),
  });

  const comm = community as any;
  const communityId = comm?.id as string | undefined;

  const { data: isMember = false } = useQuery({
    queryKey: ["community-member", communityId, user?.id],
    queryFn: () => CommunitiesService.isMember(communityId!, user!.id!),
    enabled: Boolean(communityId && user?.id),
  });

  const { data: questions = [] } = useQuery({
    queryKey: ["community-questions", communityId],
    queryFn: () => CommunitiesService.listCommunityQuestions(communityId!, 20),
    enabled: Boolean(communityId),
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !communityId) throw new Error("Sign in to join this space.");
      if (isMember) {
        await CommunitiesService.leaveCommunity(communityId, user.id);
        return false;
      }
      await CommunitiesService.joinCommunity(communityId, user.id);
      return true;
    },
    onSuccess: (joined) => {
      AppHaptics.success();
      setActionError("");
      queryClient.invalidateQueries({ queryKey: ["community-member", communityId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["community", slug] });
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      Alert.alert(joined ? "Joined" : "Left", joined ? `You are now a member of ${comm.name}.` : `You left ${comm.name}.`);
    },
    onError: (err) => {
      AppHaptics.error();
      setActionError(normalizeError(err).message);
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <Header onBack={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)" as any))} />
        <View className="flex-1 px-5 py-5 space-y-4">
          <Skeleton height={28} width="60%" className="bg-surface-container" />
          <Skeleton height={140} className="bg-surface-container" />
          <Skeleton height={80} className="bg-surface-container" />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !comm) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <Header onBack={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)" as any))} />
        <ErrorState
          title="Couldn't load this Space"
          message="It may have been removed or the connection dropped."
          errorCode="COMMUNITY_LOAD_FAILED"
          onRetry={() => refetch()}
          onGoHome={() => router.replace("/(tabs)" as any)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <Header
        onBack={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)" as any))}
        onShare={comm.name && slug ? () => ShareService.shareCommunity(comm.name, slug) : undefined}
      />

      <ScrollView
        className="flex-1 px-5 py-5"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => refetch()} tintColor="#818CF8" />
        }
      >
        {/* Header Card */}
        <Card className="p-6 mb-5 border border-white/[0.08] shadow-lg shadow-black/30">
          <View className="flex-row items-center space-x-2.5 mb-3">
            <Badge variant="category" label="Verified Space" />
            <View className="flex-row items-center space-x-1 px-2.5 py-1 rounded-full bg-surface-container-high border border-outline-variant/40">
              <Users size={12} color="#94A3B8" />
              <Typography variant="label-sm" className="text-on-surface-variant/80 font-medium normal-case">
                {(comm.member_count || 1).toLocaleString()} scholars
              </Typography>
            </View>
          </View>

          <Typography variant="headline-lg" className="text-on-surface mb-2 font-bold text-2xl">
            {comm.name}
          </Typography>
          <Typography variant="body-md" className="text-on-surface-variant leading-relaxed mb-6">
            {comm.description}
          </Typography>

          {actionError ? (
            <Typography variant="label-sm" className="text-error mb-3 normal-case">
              {actionError}
            </Typography>
          ) : null}

          {!user?.id ? (
            <Button variant="outline" size="md" onPress={() => router.push("/(auth)/login" as any)}>
              Sign in to join
            </Button>
          ) : (
            <View className="space-y-2.5">
              <Button
                variant={isMember ? "secondary" : "primary"}
                size="md"
                loading={joinMutation.isPending}
                leftIcon={
                  isMember ? (
                    <UserCheck size={16} color="#818CF8" />
                  ) : (
                    <UserPlus size={16} color="#0F172A" />
                  )
                }
                onPress={() => joinMutation.mutate()}
                className="w-full"
              >
                {isMember ? "Leave Space" : "Join Space"}
              </Button>

              {/* Ask scoped to this Space — composer pre-locked via communityId */}
              {isMember && (
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<MessageSquare size={16} color="#0F172A" />}
                  onPress={() => {
                    AppHaptics.medium();
                    router.push({
                      pathname: "/question/new",
                      params: { communityId: communityId as string },
                    } as any);
                  }}
                  className="w-full"
                >
                  Ask in this Space
                </Button>
              )}
            </View>
          )}
        </Card>

        {/* Rules */}
        {comm.rules ? (
          <Card className="p-5 mb-5 border border-outline-variant/60">
            <View className="flex-row items-center space-x-2.5 mb-3">
              <View className="p-1.5 rounded-lg bg-primary-container/40 border border-primary/30">
                <Shield size={16} color="#818CF8" />
              </View>
              <Typography variant="label-md" className="text-primary font-bold normal-case">
                Space Guidelines & Integrity
              </Typography>
            </View>
            <Typography variant="body-sm" className="text-on-surface-variant leading-relaxed">
              {comm.rules}
            </Typography>
          </Card>
        ) : null}

        {/* Community Questions */}
        <View className="mb-3">
          <Typography variant="label-lg" className="text-on-surface font-bold">
            Recent Inquiries in this Space
          </Typography>
        </View>

        {questions.length === 0 ? (
          <Card className="p-6 items-center border border-outline-variant/60">
            <MessageSquare size={24} color="#94A3B8" className="mb-2" />
            <Typography variant="body-sm" className="text-on-surface-variant text-center">
              No questions posted here yet.
            </Typography>
          </Card>
        ) : (
          questions.map((q: any) => (
            <Card
              key={q.id}
              className="p-4 mb-3 border border-outline-variant/60"
              onPress={() => router.push(`/question/${q.id}` as any)}
            >
              <View className="flex-row items-start justify-between mb-2">
                <Badge variant={q.status === "solved" ? "solved" : "open"} label={q.status === "solved" ? "Solved" : "Open"} />
                <View className="flex-row items-center space-x-1">
                  <MessageSquare size={12} color="#94A3B8" />
                  <Typography variant="label-sm" className="text-on-surface-variant/70">
                    {q.answer_count ?? 0}
                  </Typography>
                </View>
              </View>
              <Typography variant="label-md" className="text-on-surface font-bold mb-1" numberOfLines={2}>
                {q.title}
              </Typography>
              <Typography variant="body-sm" className="text-on-surface-variant" numberOfLines={2}>
                {q.body}
              </Typography>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ onBack, onShare }: { onBack: () => void; onShare?: () => void }) {
  return (
    <View className="px-5 py-3 border-b border-surface-container-high/80 flex-row items-center justify-between">
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => {
          AppHaptics.light();
          onBack();
        }}
        className="w-10 h-10 rounded-xl bg-surface-container items-center justify-center border border-outline-variant/60 active:bg-surface-container-high"
      >
        <ArrowLeft size={20} color="#F8FAFC" />
      </TouchableOpacity>
      <Typography variant="label-lg" className="text-on-surface font-bold">
        Academic Space
      </Typography>
      {onShare ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Share this Space"
          onPress={() => {
            AppHaptics.light();
            onShare();
          }}
          className="w-10 h-10 rounded-xl bg-surface-container items-center justify-center border border-outline-variant/60 active:bg-surface-container-high"
        >
          <Share2 size={18} color="#818CF8" />
        </TouchableOpacity>
      ) : (
        <View className="w-10" />
      )}
    </View>
  );
}

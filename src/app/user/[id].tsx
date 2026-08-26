import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Typography } from "@/components/ui/Typography";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { ContributorBadge } from "@/components/domain/ContributorBadge";
import { supabase } from "@/lib/supabase";
import { QuestionsService } from "@/services/questions";
import { FollowsService } from "@/services/follows";
import { SafetyService } from "@/services/safety";
import { ShareService } from "@/lib/sharing";
import { normalizeError } from "@/lib/errors";
import { useAuthStore } from "@/stores/authStore";
import { AppHaptics } from "@/lib/haptics";
import {
  ArrowLeft,
  School,
  BookOpen,
  Award,
  ShieldCheck,
  UserPlus,
  UserCheck,
  Share2,
  Flag,
  Ban,
} from "lucide-react-native";

/**
 * Public scholar profile viewer. Shows another user's profile with
 * follow / share / report / block actions. Own profile redirects to the
 * tabbed profile screen.
 */
export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: me } = useAuthStore();

  const isOwnProfile = Boolean(me?.id && me.id === id);

  const { data: profile, isLoading, isError, refetch } = useQuery({
    queryKey: ["profile", id as string],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, education(*)")
        .eq("id", id as string)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id) && !isOwnProfile,
  });

  const { data: questions = [] } = useQuery({
    queryKey: ["profile-questions", id as string],
    queryFn: () => QuestionsService.listUserQuestions(id as string, 10),
    enabled: Boolean(id) && !isOwnProfile,
  });

  const { data: isFollowing = false } = useQuery({
    queryKey: ["is-following", me?.id, id],
    queryFn: () => FollowsService.isFollowing(me!.id!, id as string),
    enabled: Boolean(me?.id && id && me.id !== id),
  });

  // Social graph visibility — counts always; list behind a toggle to keep
  // the profile scannable without a second route.
  const [showConnections, setShowConnections] = useState(false);
  const { data: followCounts } = useQuery({
    queryKey: ["follow-counts", id],
    queryFn: () => FollowsService.getCounts(id as string),
    enabled: Boolean(id) && !isOwnProfile,
    staleTime: 60 * 1000,
  });
  const { data: connectionList = [] } = useQuery({
    queryKey: ["connections", id, showConnections],
    queryFn: () =>
      showConnections
        ? FollowsService.listFollowers(id as string, 30)
        : Promise.resolve([]),
    enabled: Boolean(id) && !isOwnProfile && showConnections,
  });

  const followMutation = useMutation({
    mutationFn: () => FollowsService.toggleFollow(me!.id!, id as string),
    onSuccess: (nowFollowing) => {
      AppHaptics.success();
      queryClient.invalidateQueries({ queryKey: ["is-following", me?.id, id] });
    },
    onError: (err) => Alert.alert("Action failed", normalizeError(err).message),
  });

  const blockMutation = useMutation({
    mutationFn: () => SafetyService.blockUser(id as string, me!.id!),
    onSuccess: () => {
      AppHaptics.medium();
      Alert.alert("Scholar Blocked", "Their content will no longer appear in your feeds.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (err) => {
      // Likely already blocked — surface friendly copy.
      Alert.alert("Already blocked", normalizeError(err).message);
    },
  });

  if (isOwnProfile) {
    // Redirect to the tabbed profile screen for self-view.
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-1 items-center justify-center px-6">
          <Typography variant="body-md" className="text-on-surface-variant text-center mb-6">
            This is your own profile.
          </Typography>
          <Button variant="primary" size="md" onPress={() => router.replace("/(tabs)/profile" as any)}>
            Go to My Profile
          </Button>
        </View>
      </SafeAreaView>
    );
  }

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

  if (isError || !profile) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <Header onBack={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)" as any))} />
        <ErrorState
          title="Couldn't load this scholar"
          message="The profile may be private or the connection dropped."
          errorCode="PROFILE_LOAD_FAILED"
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
        onShare={
          profile.username
            ? () => ShareService.copyToClipboard(`@${profile.username}`, "Username")
            : undefined
        }
      />

      <ScrollView className="flex-1 px-5 py-5" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Identity Card */}
        <Card className="mb-5 p-6 items-center border border-white/[0.08] shadow-lg shadow-black/30">
          <Avatar
            name={profile.display_name || "Scholar"}
            uri={profile.avatar_path}
            size="xl"
            role={profile.current_status}
            isVerified={profile.is_verified}
            className="mb-4"
          />
          <Typography variant="headline-md" className="text-on-surface text-center font-bold">
            {profile.display_name || "Academic Scholar"}
          </Typography>
          <Typography variant="label-md" className="text-primary font-bold mb-3">
            @{profile.username || "scholar"}
          </Typography>
          <ContributorBadge status={profile.current_status} isVerified={profile.is_verified} />

          {/* Follower / following counts — tappable to reveal the list */}
          {(followCounts?.followers ?? 0) > 0 || (followCounts?.following ?? 0) > 0 ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`${followCounts?.followers ?? 0} followers, ${followCounts?.following ?? 0} following. Tap to ${showConnections ? "hide" : "show"} followers.`}
              onPress={() => {
                AppHaptics.light();
                setShowConnections((v: boolean) => !v);
              }}
              className="flex-row items-center justify-center space-x-1.5 mt-3 active:opacity-70"
            >
              <Typography variant="label-sm" className="text-on-surface font-bold">
                {(followCounts?.followers ?? 0).toLocaleString()} followers
              </Typography>
              <Typography variant="label-sm" className="text-on-surface-variant/50">
                ·
              </Typography>
              <Typography variant="label-sm" className="text-on-surface font-bold">
                {(followCounts?.following ?? 0).toLocaleString()} following
              </Typography>
            </TouchableOpacity>
          ) : null}

          {profile.bio ? (
            <Typography variant="body-md" className="text-on-surface-variant text-center leading-relaxed mt-4 max-w-sm">
              {profile.bio}
            </Typography>
          ) : null}

          {/* Action Buttons */}
          <View className="w-full mt-6 space-y-2.5">
            {!me?.id ? (
              <Button variant="outline" size="md" onPress={() => router.push("/(auth)/login" as any)}>
                Sign in to follow
              </Button>
            ) : (
              <>
                <Button
                  variant={isFollowing ? "secondary" : "primary"}
                  size="md"
                  loading={followMutation.isPending}
                  leftIcon={
                    isFollowing ? (
                      <UserCheck size={16} color="#818CF8" />
                    ) : (
                      <UserPlus size={16} color="#0F172A" />
                    )
                  }
                  onPress={() => followMutation.mutate()}
                  className="w-full"
                >
                  {isFollowing ? "Following" : "Follow Scholar"}
                </Button>

                <View className="flex-row space-x-2.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Flag size={14} color="#F87171" />}
                    onPress={() =>
                      router.push({
                        pathname: "/report",
                        params: { targetType: "profile", targetId: id as string, targetUserId: "" },
                      } as any)
                    }
                    className="flex-1"
                  >
                    Report
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={blockMutation.isPending}
                    leftIcon={<Ban size={14} color="#F87171" />}
                    onPress={() => blockMutation.mutate()}
                    className="flex-1"
                  >
                    Block
                  </Button>
                </View>
              </>
            )}
          </View>

          {/* Followers list — revealed on demand from the count row */}
          {showConnections && (
            <View className="w-full mt-5 pt-4 border-t border-outline-variant/30">
              <Typography variant="label-md" className="text-on-surface font-bold mb-3">
                Followers
              </Typography>
              {connectionList.length === 0 ? (
                <Typography variant="body-sm" className="text-on-surface-variant/70 normal-case">
                  No followers yet.
                </Typography>
              ) : (
                connectionList.map((f: any) => (
                  <TouchableOpacity
                    key={f.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${f.display_name}'s profile`}
                    onPress={() => {
                      AppHaptics.light();
                      router.push(`/user/${f.id}` as any);
                    }}
                    className="flex-row items-center space-x-3 py-2 active:opacity-70"
                  >
                    <Avatar name={f.display_name} uri={f.avatar_path} size="sm" role={f.current_status} isVerified={f.is_verified} />
                    <View className="flex-1">
                      <Typography variant="label-md" className="text-on-surface font-semibold" numberOfLines={1}>
                        {f.display_name}
                      </Typography>
                      <Typography variant="label-sm" className="text-on-surface-variant/70 normal-case" numberOfLines={1}>
                        @{f.username}
                      </Typography>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </Card>

        {/* Stats */}
        <View className="flex-row space-x-3 mb-5">
          <StatTile
            icon={<Award size={20} color="#FBBF24" />}
            value={String(profile.reputation_score ?? 0)}
            label="Reputation"
            tone="#FBBF24"
          />
          <StatTile
            icon={<ShieldCheck size={20} color="#34D399" />}
            value={profile.is_verified ? "Verified" : "Active"}
            label="Status"
            tone="#34D399"
          />
          <StatTile
            icon={<BookOpen size={20} color="#818CF8" />}
            value={String(profile.total_answers ?? 0)}
            label="Answers"
            tone="#818CF8"
          />
        </View>

        {/* Education */}
        {Array.isArray((profile as any).education) && (profile as any).education.length > 0 && (
          <View className="mb-6">
            <Typography variant="label-lg" className="text-on-surface font-bold mb-3">
              Academic Background
            </Typography>
            {(profile as any).education.map((edu: any, idx: number) => (
              <Card key={edu.id || idx} className="p-4 mb-3 border border-outline-variant/60">
                <View className="flex-row items-center space-x-3 mb-2">
                  <View className="p-2 rounded-lg bg-primary-container/40 border border-primary/30">
                    <School size={16} color="#818CF8" />
                  </View>
                  <Typography variant="label-lg" className="text-on-surface font-bold flex-1">
                    {edu.institution_name}
                  </Typography>
                </View>
                <View className="flex-row items-center space-x-2 pl-1">
                  <BookOpen size={15} color="#94A3B8" />
                  <Typography variant="body-sm" className="text-on-surface-variant flex-1">
                    {edu.degree} in {edu.field} ({edu.start_year}
                    {edu.end_year ? ` – ${edu.end_year}` : " – Present"})
                  </Typography>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Recent Questions */}
        <Typography variant="label-lg" className="text-on-surface font-bold mb-3">
          Recent Inquiries
        </Typography>
        {questions.length === 0 ? (
          <Card className="p-6 items-center border border-outline-variant/60">
            <Typography variant="body-sm" className="text-on-surface-variant text-center">
              No public questions yet.
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
                  <Award size={12} color="#94A3B8" />
                  <Typography variant="label-sm" className="text-on-surface-variant/70">
                    {q.helpful_count ?? 0}
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
        Scholar Profile
      </Typography>
      {onShare ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Copy username"
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

function StatTile({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  tone: string;
}) {
  const containerMap: Record<string, string> = {
    "#FBBF24": "bg-amber-container/40 border-amber/40",
    "#34D399": "bg-tertiary-container/40 border-tertiary/40",
    "#818CF8": "bg-primary-container/40 border-primary/40",
  };
  const textMap: Record<string, string> = {
    "#FBBF24": "text-amber",
    "#34D399": "text-tertiary",
    "#818CF8": "text-primary",
  };
  return (
    <Card className="flex-1 p-4 items-center justify-center border border-outline-variant/60">
      <View className={`w-10 h-10 rounded-xl ${containerMap[tone]} border items-center justify-center mb-2`}>
        {icon}
      </View>
      <Typography variant="headline-sm" className={`${textMap[tone]} font-extrabold`} numberOfLines={1}>
        {value}
      </Typography>
      <Typography variant="label-sm" className="text-on-surface-variant/70 font-semibold normal-case">
        {label}
      </Typography>
    </Card>
  );
}

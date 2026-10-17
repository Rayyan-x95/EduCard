import React from "react";
import { View, ScrollView, TouchableOpacity, Alert, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { useQuery } from "@tanstack/react-query";
import { Typography } from "@/components/ui/Typography";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ContributorBadge } from "@/components/domain/ContributorBadge";
import { useAuthStore } from "@/stores/authStore";
import { AuthService } from "@/services/auth";
import { QuestionsService, QuestionListItem } from "@/services/questions";
import { PostsService, PostListItem } from "@/services/posts";
import { SafetyService } from "@/services/safety";
import { queryKeys, CACHE_TTL } from "@/lib/query-client";
import { normalizeError } from "@/lib/errors";
import { AppHaptics } from "@/lib/haptics";
import { ShareService } from "@/lib/sharing";
import { getBadgesForProfile } from "@/lib/reputation-badges";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/date";
import {
  Award,
  BookOpen,
  School,
  LogOut,
  ShieldCheck,
  Bookmark,
  Edit3,
  Settings,
  MessageSquare,
  PenSquare,
  ChevronRight,
  Sparkles,
  Share2,
} from "lucide-react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const profile = useAuthStore((s) => s.profile);
  const reset = useAuthStore((s) => s.reset);
  const [activeTab, setActiveTab] = React.useState<"questions" | "posts">("questions");
  const insets = useSafeAreaInsets();

  const isNarrow = width < 380;
  const headerBtnClass = isNarrow
    ? "w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl bg-surface-container items-center justify-center border border-outline-variant active:bg-surface-container-high web:cursor-pointer select-none active:scale-95 transition-transform"
    : "w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-surface-container items-center justify-center border border-outline-variant active:bg-surface-container-high web:cursor-pointer select-none active:scale-95 transition-transform";
  const modBtnClass = isNarrow
    ? "w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl bg-surface-container items-center justify-center border border-secondary/30 active:bg-surface-container-high web:cursor-pointer select-none active:scale-95 transition-transform"
    : "w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-surface-container items-center justify-center border border-secondary/30 active:bg-surface-container-high web:cursor-pointer select-none active:scale-95 transition-transform";
  const headerIconSize = isNarrow ? 16 : 18;

  const badges = profile ? getBadgesForProfile(profile) : [];

  // My recent questions — surfaces the user's own contributions on their profile.
  const { data: myQuestions = [] } = useQuery({
    queryKey: queryKeys.myQuestions(profile?.id),
    queryFn: () => QuestionsService.listUserQuestions(profile!.id, 10),
    enabled: Boolean(profile?.id),
  });

  // My recent discussion posts
  const { data: myPosts = [] } = useQuery({
    queryKey: queryKeys.userPosts(profile?.id),
    queryFn: () => PostsService.listUserPosts(profile!.id, 10),
    enabled: Boolean(profile?.id),
  });

  const { data: isModerator = false } = useQuery({
    queryKey: queryKeys.isModerator(),
    queryFn: () => SafetyService.amIModerator(),
    enabled: Boolean(profile?.id),
    // Moderator role changes only on admin promotion — safe to cache for 30 min
    staleTime: CACHE_TTL.MODERATOR_ROLE,
  });

  const handleSignOut = () => {
    // Destructive-ish action: confirm before killing the session.
    Alert.alert("Sign Out", "Are you sure you want to sign out of EduCard?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          AppHaptics.medium();
          try {
            await AuthService.signOut();
            reset();
          } catch (err) {
            // normalizeError keeps provider internals out of the UI.
            Alert.alert("Sign Out Error", normalizeError(err).message);
          }
        },
      },
    ]);
  };

  if (!profile) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-1 w-full max-w-2xl mx-auto px-5 pt-8 gap-y-6">
          <View className="items-center">
            <Skeleton height={120} width={120} className="rounded-full bg-surface-container-high mb-4 shadow-md" />
            <Skeleton height={28} width={200} className="bg-surface-container-high mb-2" />
            <Skeleton height={16} width={120} className="bg-surface-container-high" />
          </View>
          <Skeleton height={100} className="bg-surface-container-high rounded-2xl" />
          <Skeleton height={150} className="bg-surface-container-high rounded-2xl" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <View className="flex-1 w-full max-w-2xl mx-auto">
        <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingTop: Math.max(insets.top, 16) + 70, paddingBottom: 140 }}>
          {/* Identity Card */}
          <View className="mb-8">
            <Card className="p-8 items-center">
              <Avatar
              name={profile?.display_name || "User"}
              uri={profile?.avatar_path}
              size="xl"
              role={profile?.current_status || "undergraduate"}
              isVerified={profile?.is_verified}
              className="mb-4 shadow-md"
            />
            <Typography variant="headline-md" className="text-on-surface text-center font-headline font-bold text-2xl tracking-tight">
              {profile?.display_name || "User"}
            </Typography>
            <Typography variant="label-md" className="text-primary font-bold mb-3">
              @{profile?.username || "user"}
            </Typography>

            <ContributorBadge
              status={profile?.current_status || "undergraduate"}
              isVerified={profile?.is_verified}
              className="mb-4"
            />

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Edit Profile"
              onPress={() => {
                AppHaptics.light();
                router.push("/settings/edit-profile" as any);
              }}
              className="flex-row items-center px-5 py-2.5 min-h-[40px] rounded-full bg-surface-container-high border border-outline-variant active:bg-surface-container-highest"
            >
              <View className="mr-1.5"><Edit3 size={14} color="#D49B35" /></View>
              <Typography variant="label-md" className="text-primary font-bold">
                Edit Profile
              </Typography>
            </TouchableOpacity>
          </Card>
          </View>

          {/* Moderator Access Tile */}
          {isModerator && (
            <Card
              className="p-4 mb-5 border border-secondary/30 bg-surface-container"
              onPress={() => {
                AppHaptics.light();
                router.push("/moderation" as any);
              }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-x-3">
                  <View className="p-2 rounded-lg bg-secondary-container/40 border border-secondary/30">
                    <ShieldCheck size={18} color="#38BDF8" />
                  </View>
                  <View>
                    <Typography variant="label-lg" className="text-secondary font-bold">
                      Moderation Dashboard
                    </Typography>
                    <Typography variant="body-sm" className="text-on-surface-variant font-medium">
                      Review flagged questions and moderation queue
                    </Typography>
                  </View>
                </View>
                <ChevronRight size={18} color="#38BDF8" />
              </View>
            </Card>
          )}

          {/* Oxford Archival Scholar Standing Masthead */}
          <Card className="mb-5 p-5 border border-outline-variant bg-surface-container/70 shadow-sm shadow-black/30">
            <View className="flex-row items-center justify-between">
              {/* Primary Scholarly Metric */}
              <View className="flex-1 mr-4">
                <View className="flex-row items-center mb-1.5">
                  <Award size={16} color="#D49B35" />
                  <Typography variant="label-sm" className="text-primary font-bold ml-1.5 tracking-wider uppercase">
                    Reputation
                  </Typography>
                </View>
                <Typography variant="display-lg" className="text-primary-light font-headline font-bold text-3xl tracking-tight leading-none">
                  {profile?.reputation_score || 0}
                </Typography>
                <Typography variant="body-sm" className="text-on-surface-muted text-[12px] mt-1 font-medium">
                  reputation
                </Typography>
              </View>

              {/* Vertical Hairline Divider */}
              <View className="w-[1px] h-14 bg-outline-variant mr-4" />

              {/* Secondary Scholarly Telemetry */}
              <View className="justify-center gap-y-2">
                <View className="flex-row items-center">
                  <View className="w-7 h-7 rounded-lg bg-tertiary-container border border-tertiary/40 items-center justify-center mr-2">
                    <ShieldCheck size={14} color="#2EBF7B" />
                  </View>
                  <View>
                    <Typography variant="label-md" className="text-tertiary font-bold leading-tight">
                      {profile?.is_verified ? "Verified Scholar" : "Active Member"}
                    </Typography>
                    <Typography variant="label-sm" className="text-on-surface-muted text-[10px] font-medium">
                      Status
                    </Typography>
                  </View>
                </View>

                <View className="flex-row items-center">
                  <View className="w-7 h-7 rounded-lg bg-surface-container-high border border-outline-variant items-center justify-center mr-2">
                    <MessageSquare size={14} color="#A3B3C4" />
                  </View>
                  <View>
                    <Typography variant="label-md" className="text-on-surface font-bold leading-tight">
                      {profile?.total_answers || 0} Contributions
                    </Typography>
                    <Typography variant="label-sm" className="text-on-surface-muted text-[10px] font-medium">
                      Answers & Solutions
                    </Typography>
                  </View>
                </View>
              </View>
            </View>
          </Card>

          {/* Academic Credentials & Badges (Reputation 2.0) */}
          {badges.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center gap-x-2 mb-3">
                <Sparkles size={16} color="#D49B35" />
                <Typography variant="label-lg" className="text-on-surface font-bold">
                  Achievements
                </Typography>
              </View>
              <View className="flex-row flex-wrap gap-2.5">
                {badges.map((b) => (
                  <View
                    key={b.id}
                    className="flex-row items-center gap-x-2.5 px-3.5 py-2.5 rounded-xl bg-surface-container border border-outline-variant"
                  >
                    <Award
                      size={16}
                      color={
                        b.variant === "tertiary"
                          ? "#2EBF7B"
                          : "#D49B35"
                      }
                    />
                    <View>
                      <Typography variant="label-sm" className="text-on-surface font-bold">
                        {b.name}
                      </Typography>
                      <Typography
                        variant="label-sm"
                        className="text-on-surface-muted text-[11px] normal-case font-medium"
                        numberOfLines={1}
                      >
                        {b.description}
                      </Typography>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Academic Background Section */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <View className="mr-2"><School size={16} color="#D49B35" /></View>
              <Typography variant="label-lg" className="text-on-surface font-bold">
                Education
              </Typography>
            </View>

            {profile?.bio && (
              <Card className="mb-3.5 p-4 bg-surface-container border border-outline-variant">
                <Typography variant="body-md" className="text-on-surface leading-relaxed">
                  {profile.bio}
                </Typography>
              </Card>
            )}

            {profile?.education && profile.education.length > 0 ? (
              profile.education.map((edu, idx) => (
                <Card key={edu.id || idx} className="p-4 mb-3 border border-outline-variant">
                  <View className="mb-2 flex-row items-center">
                    <View className="p-2 rounded-lg bg-primary-container border border-primary/40 mr-3">
                      <School size={16} color="#D49B35" />
                    </View>
                    <Typography variant="label-lg" className="text-on-surface font-bold flex-1">
                      {edu.institution_name}
                    </Typography>
                  </View>
                  <View className="flex-row items-start pl-1">
                    <View className="mt-0.5 mr-3"><BookOpen size={15} color="#A3B3C4" /></View>
                    <Typography variant="body-sm" className="text-on-surface-variant flex-1">
                      {edu.degree} in {edu.field} ({edu.start_year}{edu.end_year ? ` – ${edu.end_year}` : " – Present"})
                    </Typography>
                  </View>
                </Card>
              ))
            ) : (
              <Card className="p-4 border border-outline-variant">
                <View className="flex-row items-center mb-2">
                  <View className="mr-3"><School size={18} color="#D49B35" /></View>
                  <Typography variant="body-md" className="text-on-surface-variant italic">
                    No academic records listed. You can update your educational background in Edit Profile.
                  </Typography>
                </View>
              </Card>
            )}
          </View>

          {/* Contribution History — Questions & Discussions */}
          <View className="mb-6">
            <View className="mb-3">
              <SegmentedControl
                options={[
                  { label: `Questions (${myQuestions.length})`, value: "questions" },
                  { label: `Posts (${myPosts.length})`, value: "posts" },
                ]}
                value={activeTab}
                onChange={(val) => setActiveTab(val as "questions" | "posts")}
              />
            </View>

            {activeTab === "questions" ? (
              myQuestions.length > 0 ? (
                myQuestions.map((q: QuestionListItem) => (
                  <Card
                    key={q.id}
                    className="p-4 mb-3 border border-outline-variant"
                    onPress={() => {
                      AppHaptics.light();
                      router.push(`/question/${q.id}` as any);
                    }}
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <Badge variant={q.status === "solved" ? "solved" : "open"} label={q.status === "solved" ? "Solved" : "Open"} />
                      <View className="flex-row items-center">
                        <View className="mr-1"><MessageSquare size={12} color="#A3B3C4" /></View>
                        <Typography variant="label-sm" className="text-on-surface-muted font-medium">
                          {q.answer_count ?? 0}
                        </Typography>
                      </View>
                    </View>
                    <Typography variant="label-md" className="text-on-surface font-bold mb-1" numberOfLines={2}>
                      {q.title}
                    </Typography>
                    <Typography variant="label-sm" className="text-on-surface-muted normal-case mt-1">
                      {formatDate(q.created_at)}
                    </Typography>
                  </Card>
                ))
              ) : (
                <Card className="p-5 items-center border border-outline-variant">
                  <View className="mb-1.5"><MessageSquare size={20} color="#A3B3C4" /></View>
                  <Typography variant="body-sm" className="text-on-surface-variant text-center">
                    No questions asked yet.
                  </Typography>
                </Card>
              )
            ) : (
              myPosts.length > 0 ? (
                myPosts.map((p: PostListItem) => (
                  <Card
                    key={p.id}
                    className="p-4 mb-3 border border-outline-variant"
                    onPress={() => {
                      AppHaptics.light();
                      router.push(`/post/${p.id}` as any);
                    }}
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <Badge variant="category" label="Discussion" />
                      <View className="flex-row items-center">
                        <View className="mr-3"><Typography variant="label-sm" className="text-on-surface-muted font-medium">
                          {p.helpful_count ?? 0} helpful
                        </Typography></View>
                        <View className="flex-row items-center">
                          <View className="mr-1"><MessageSquare size={12} color="#A3B3C4" /></View>
                          <Typography variant="label-sm" className="text-on-surface-muted font-medium">
                            {p.comment_count ?? 0}
                          </Typography>
                        </View>
                      </View>
                    </View>
                    <Typography variant="body-md" className="text-on-surface leading-relaxed mb-1" numberOfLines={3}>
                      {p.body}
                    </Typography>
                    <Typography variant="label-sm" className="text-on-surface-muted normal-case mt-1.5">
                      {formatDate(p.created_at)}
                    </Typography>
                  </Card>
                ))
              ) : (
                <Card className="p-5 items-center border border-outline-variant">
                  <View className="mb-1.5"><PenSquare size={20} color="#A3B3C4" /></View>
                  <Typography variant="body-sm" className="text-on-surface-variant text-center">
                    No discussion posts shared yet.
                  </Typography>
                </Card>
              )
            )}
          </View>

          {/* Sign Out Button */}
          <Button
            variant="danger"
            size="md"
            leftIcon={<LogOut size={16} color="#FFCCD3" />}
            onPress={handleSignOut}
            className="w-full mb-6"
          >
            Sign Out
          </Button>
        </ScrollView>

        {/* Absolute Top Header */}
        <BlurView intensity={80} tint="dark" className="absolute top-0 left-0 right-0 z-10 w-full border-b border-white/5" style={{ paddingTop: Math.max(insets.top, 16) }}>
          <View className="flex-row items-center justify-between px-6 py-4">
            <Typography variant="headline-md" className="text-on-surface font-headline font-bold text-2xl tracking-tight flex-1 mr-2" numberOfLines={1}>
              Profile
            </Typography>

            <View
              className={
                isNarrow
                  ? "flex-row items-center justify-end flex-wrap max-w-[84px] gap-1.5"
                  : "flex-row items-center gap-x-2"
              }
            >
              {isModerator && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Moderation Dashboard"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => {
                    AppHaptics.light();
                    router.push("/moderation" as any);
                  }}
                  className={modBtnClass}
                >
                  <ShieldCheck size={headerIconSize} color="#38BDF8" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Saved Bookmarks"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => {
                  AppHaptics.light();
                  router.push("/bookmarks" as any);
                }}
                className={headerBtnClass}
              >
                <Bookmark size={headerIconSize} color="#D49B35" />
              </TouchableOpacity>

              {profile?.username && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Share Profile"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => {
                    AppHaptics.light();
                    ShareService.shareProfile(profile.username!, profile.display_name);
                  }}
                  className={headerBtnClass}
                >
                  <Share2 size={headerIconSize} color="#A3B3C4" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Settings and Privacy"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => {
                  AppHaptics.light();
                  router.push("/settings/privacy" as any);
                }}
                className={headerBtnClass}
              >
                <Settings size={headerIconSize} color="#A3B3C4" />
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </View>
    </View>
  );
}

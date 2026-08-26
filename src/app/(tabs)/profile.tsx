import React from "react";
import { View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Typography } from "@/components/ui/Typography";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ContributorBadge } from "@/components/domain/ContributorBadge";
import { useAuthStore } from "@/stores/authStore";
import { AuthService } from "@/services/auth";
import { QuestionsService } from "@/services/questions";
import { normalizeError } from "@/lib/errors";
import { AppHaptics } from "@/lib/haptics";
import {
  Award,
  BookOpen,
  School,
  LogOut,
  ShieldCheck,
  Bookmark,
  Edit3,
  Settings,
  Sparkles,
  MessageSquare,
} from "lucide-react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, reset } = useAuthStore();

  // My recent questions — surfaces the scholar's own contributions on their profile.
  const { data: myQuestions = [] } = useQuery({
    queryKey: ["my-questions", profile?.id],
    queryFn: () => QuestionsService.listUserQuestions(profile!.id, 10),
    enabled: Boolean(profile?.id),
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

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-3 border-b border-surface-container-high/80">
        <Typography variant="headline-md" className="text-on-surface font-bold">
          Scholar Profile
        </Typography>

        <View className="flex-row items-center space-x-2">
          <TouchableOpacity
            onPress={() => {
              AppHaptics.light();
              router.push("/bookmarks" as any);
            }}
            className="w-10 h-10 rounded-xl bg-surface-container items-center justify-center border border-outline-variant/60 active:bg-surface-container-high"
          >
            <Bookmark size={18} color="#818CF8" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              AppHaptics.light();
              router.push("/settings/privacy" as any);
            }}
            className="w-10 h-10 rounded-xl bg-surface-container items-center justify-center border border-outline-variant/60 active:bg-surface-container-high"
          >
            <Settings size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 py-5" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Scholar Identity Card (Apple ID Card Style) */}
        <Card className="mb-5 p-6 items-center border border-white/[0.08] shadow-lg shadow-black/30">
          <Avatar
            name={profile?.display_name || "Scholar"}
            uri={profile?.avatar_path}
            size="xl"
            role={profile?.current_status || "undergraduate"}
            isVerified={profile?.is_verified}
            className="mb-4 shadow-md"
          />
          <Typography variant="headline-md" className="text-on-surface text-center font-bold">
            {profile?.display_name || "Academic Scholar"}
          </Typography>
          <Typography variant="label-md" className="text-primary font-bold mb-3">
            @{profile?.username || "scholar"}
          </Typography>

          <ContributorBadge
            status={profile?.current_status || "undergraduate"}
            isVerified={profile?.is_verified}
            className="mb-4"
          />

          <TouchableOpacity
            onPress={() => {
              AppHaptics.light();
              router.push("/settings/edit-profile" as any);
            }}
            className="flex-row items-center space-x-1.5 px-4 py-2 rounded-xl bg-surface-container-high border border-outline-variant/60 active:bg-surface-container-highest"
          >
            <Edit3 size={14} color="#818CF8" />
            <Typography variant="label-md" className="text-primary font-bold normal-case">
              Edit Scholar Profile
            </Typography>
          </TouchableOpacity>
        </Card>

        {/* Bento Stats Grid */}
        <View className="flex-row space-x-3 mb-5">
          {/* Reputation Tile */}
          <Card className="flex-1 p-4 mb-0 items-center justify-center border border-outline-variant/60">
            <View className="w-10 h-10 rounded-xl bg-amber-container/40 border border-amber/40 items-center justify-center mb-2 shadow-sm shadow-amber/20">
              <Award size={20} color="#FBBF24" />
            </View>
            <Typography variant="headline-md" className="text-on-surface font-extrabold">
              {profile?.reputation_score || 0}
            </Typography>
            <Typography variant="label-sm" className="text-on-surface-variant/70 font-semibold normal-case">
              Reputation
            </Typography>
          </Card>

          {/* Institutional Trust Tile */}
          <Card className="flex-1 p-4 mb-0 items-center justify-center border border-outline-variant/60">
            <View className="w-10 h-10 rounded-xl bg-tertiary-container/40 border border-tertiary/40 items-center justify-center mb-2 shadow-sm shadow-tertiary/20">
              <ShieldCheck size={20} color="#34D399" />
            </View>
            <Typography variant="headline-md" className="text-tertiary font-extrabold">
              {profile?.is_verified ? "Verified" : "Active"}
            </Typography>
            <Typography variant="label-sm" className="text-on-surface-variant/70 font-semibold normal-case">
              Scholar Status
            </Typography>
          </Card>

          {/* Answers Contributed Tile */}
          <Card className="flex-1 p-4 mb-0 items-center justify-center border border-outline-variant/60">
            <View className="w-10 h-10 rounded-xl bg-primary-container/40 border border-primary/40 items-center justify-center mb-2 shadow-sm shadow-primary/20">
              <MessageSquare size={20} color="#818CF8" />
            </View>
            <Typography variant="headline-md" className="text-primary font-extrabold">
              {profile?.total_answers || 0}
            </Typography>
            <Typography variant="label-sm" className="text-on-surface-variant/70 font-semibold normal-case">
              Answers
            </Typography>
          </Card>
        </View>

        {/* Academic Credentials Section */}
        <View className="mb-6">
          <View className="flex-row items-center space-x-2 mb-3">
            <Sparkles size={16} color="#818CF8" />
            <Typography variant="label-lg" className="text-on-surface font-bold">
              Academic Background
            </Typography>
          </View>

          {profile?.bio && (
            <Card className="mb-3.5 p-4 bg-surface-container border border-outline-variant/60">
              <Typography variant="body-md" className="text-on-surface leading-relaxed">
                {profile.bio}
              </Typography>
            </Card>
          )}

          {profile?.education && profile.education.length > 0 ? (
            profile.education.map((edu: any, idx: number) => (
              <Card key={edu.id || idx} className="p-4 mb-3 space-y-2 border border-outline-variant/60">
                <View className="flex-row items-center space-x-3">
                  <View className="p-2 rounded-lg bg-primary-container/40 border border-primary/30">
                    <School size={16} color="#818CF8" />
                  </View>
                  <Typography variant="label-lg" className="text-on-surface font-bold flex-1">
                    {edu.institution_name}
                  </Typography>
                </View>
                <View className="flex-row items-center space-x-3 pl-1">
                  <BookOpen size={15} color="#94A3B8" />
                  <Typography variant="body-sm" className="text-on-surface-variant flex-1">
                    {edu.degree} in {edu.field} ({edu.start_year}{edu.end_year ? ` – ${edu.end_year}` : " – Present"})
                  </Typography>
                </View>
              </Card>
            ))
          ) : (
            <Card className="p-4 space-y-2 border border-outline-variant/60">
              <View className="flex-row items-center space-x-3">
                <School size={18} color="#818CF8" />
                <Typography variant="body-md" className="text-on-surface-variant italic">
                  Academic details completed in onboarding
                </Typography>
              </View>
            </Card>
          )}
        </View>

        {/* My Recent Questions */}
        {myQuestions.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center space-x-2 mb-3">
              <Sparkles size={16} color="#818CF8" />
              <Typography variant="label-lg" className="text-on-surface font-bold">
                My Recent Inquiries
              </Typography>
            </View>
            {myQuestions.map((q: any) => (
              <Card
                key={q.id}
                className="p-4 mb-3 border border-outline-variant/60"
                onPress={() => {
                  AppHaptics.light();
                  router.push(`/question/${q.id}` as any);
                }}
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
              </Card>
            ))}
          </View>
        )}

        {/* Sign Out Button */}
        <Button
          variant="danger"
          size="md"
          leftIcon={<LogOut size={16} color="#F87171" />}
          onPress={handleSignOut}
          className="w-full mb-6"
        >
          Sign Out of Account
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

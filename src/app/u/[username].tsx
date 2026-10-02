import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { AuthService } from "@/services/auth";
import { useAuthStore } from "@/stores/authStore";

/**
 * Universal profile redirector for shared links: https://educard.ninety5.in/u/:username
 * Resolves the username to user ID and routes to the user profile screen.
 */
export default function UserProfileByUsernameScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const me = useAuthStore((state) => state.user);

  const cleanUsername = (username ?? "").replace(/^@/, "").trim();

  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["profile-by-username", cleanUsername],
    queryFn: () => AuthService.getProfileByUsername(cleanUsername),
    enabled: Boolean(cleanUsername),
  });

  useEffect(() => {
    if (!profile) return;

    if (me?.id && me.id === profile.id) {
      router.replace("/(tabs)/profile" as any);
    } else {
      router.replace({
        pathname: "/user/[id]",
        params: { id: profile.id },
      } as any);
    }
  }, [profile, me?.id, router]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center p-6">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Typography variant="body-md" className="mt-4 text-on-surface-variant">
          Loading @{cleanUsername || "user"}&apos;s profile...
        </Typography>
      </SafeAreaView>
    );
  }

  if (isError || !profile) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center p-6">
        <View className="items-center max-w-sm">
          <Typography variant="headline-md" className="mb-2 text-center text-on-surface">
            Profile Not Found
          </Typography>
          <Typography variant="body-md" className="text-center mb-6 text-on-surface-variant">
            We couldn&apos;t find an academic profile for @{cleanUsername || "user"}.
          </Typography>
          <Button
            onPress={() => router.replace("/(tabs)" as any)}
            variant="primary"
          >
            Back to Home
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface items-center justify-center p-6">
      <ActivityIndicator size="small" color="#4F46E5" />
    </SafeAreaView>
  );
}

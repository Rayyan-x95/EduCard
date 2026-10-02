import React, { useEffect } from "react";
import { View, Platform } from "react-native";
import * as Application from "expo-application";
import { Stack, useRouter, useSegments } from "expo-router";
import Head from "expo-router/head";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { AuthService } from "@/services/auth";
import { NotificationsService } from "@/services/notifications";
import { Analytics } from "@/lib/analytics";
import { Telemetry } from "@/lib/telemetry";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { readOnboardingFlag } from "@/lib/onboarding-cache";
import { buildCspHeader } from "@/lib/csp";
import "../../global.css";

SplashScreen.preventAutoHideAsync().catch(() => {});

function AuthProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isOnboarded, isLoading, setSession, setProfile, setLoading } =
    useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const userId = session?.user?.id;
  // Set when a PASSWORD_RECOVERY deep link arrives; the navigation guard
  // must hold the user on the reset form instead of bouncing them to
  // onboarding (cold start) or tabs (warm resume) while it is active.
  const [isRecoveringPassword, setIsRecoveringPassword] = React.useState(false);
  useRealtimeNotifications(userId);

  // Uid whose profile has already been loaded this session. TOKEN_REFRESHED
  // fires on a timer for every active session; without this guard each tick
  // re-fetched profiles+education and re-registered push tokens.
  const profileLoadedForRef = React.useRef<string | null>(null);

  // Listen for user tapping a push notification
  useEffect(() => {
    const subscription = NotificationsService.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, unknown>;
        if (data?.questionId) {
          router.push(`/question/${data.questionId}` as any);
        } else if (data?.postId) {
          router.push(`/post/${data.postId}` as any);
        } else if (data?.communitySlug) {
          router.push(`/community/${data.communitySlug}` as any);
        } else if (data?.profileId) {
          // Follow pushes carry the followed user's id (see send-push compose).
          router.push(`/user/${data.profileId}` as any);
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, [router]);

  // Unified user profile loader & push registration handler
  const loadUserProfile = React.useCallback(async (uid: string) => {
    if (profileLoadedForRef.current === uid) return;
    Analytics.identify(uid);
    NotificationsService.registerForPushNotifications(uid);
    try {
      const profile = await AuthService.getCurrentProfile(uid);
      profileLoadedForRef.current = uid;
      setProfile(profile);
    } catch (err) {
      Telemetry.recordError(err instanceof Error ? err : new Error(String(err)), {
        source: "profileFetch",
      });
      // Cold-start network failure: fall back to the locally cached
      // onboarding flag instead of demoting an onboarded user back into the
      // onboarding wizard (a re-run would insert duplicate education rows).
      const cached = await readOnboardingFlag(uid);
      useAuthStore.getState().setOnboardingFallback(uid, Boolean(cached));
      setProfile(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize analytics + listen to Supabase auth state
  useEffect(() => {
    Analytics.track("app_opened");
    Telemetry.init({
      appVersion: Application.nativeApplicationVersion ?? "1.0.0",
      platform: Platform.OS,
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      if (_event === "PASSWORD_RECOVERY") {
        // Deep link back into the app from the reset email.
        setIsRecoveringPassword(true);
        router.replace("/(auth)/reset-password" as any);
        return;
      }

      if (_event === "SIGNED_OUT") {
        setIsRecoveringPassword(false);
        useAuthStore.getState().reset();
        queryClient.clear();
      }

      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        Analytics.reset();
        profileLoadedForRef.current = null;
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadUserProfile]);

  // Handle navigation guard
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboardingGroup = segments[0] === "(onboarding)";

    // Password-recovery deep link: every guard branch above matches the
    // reset route in some state (cold start → onboarding bounce, warm
    // resume → tabs bounce), so recovery mode suspends redirects entirely.
    // The flag clears once the user leaves the auth group (the reset screen
    // routes to sign-in on success) or when SIGNED_OUT fires.
    if (isRecoveringPassword) {
      if (!inAuthGroup) {
        setTimeout(() => setIsRecoveringPassword(false), 0);
      }
      return;
    }

    if (!session && !inAuthGroup) {
      // Redirect to login if unauthenticated
      router.replace("/(auth)/login" as any);
    } else if (session && !isOnboarded && !inOnboardingGroup) {
      // Redirect to onboarding if not completed
      router.replace("/(onboarding)" as any);
    } else if (session && isOnboarded && (inAuthGroup || inOnboardingGroup)) {
      // Redirect to home if fully authenticated and onboarded
      router.replace("/(tabs)" as any);
    }
  }, [session, isOnboarded, isLoading, isRecoveringPassword, segments, router]);

  // Hide splash once auth guard has resolved so cold-start isn't a blank flash
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);

  if (isLoading) {
    return <View className="flex-1 bg-surface" />;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <Head>
        <title>EduCard — Student Knowledge Network</title>
        <meta
          name="description"
          content="EduCard connects university students and alumni to ask questions, share knowledge, and collaborate."
        />
        <meta property="og:title" content="EduCard — Student Knowledge Network" />
        <meta
          property="og:description"
          content="Ask questions, connect with peers, and share knowledge across campus communities."
        />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="EduCard" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="EduCard — Student Knowledge Network" />
        <meta
          name="twitter:description"
          content="Ask questions, connect with peers, and share knowledge across campus communities."
        />
        <meta name="theme-color" content="#0B0F12" />
        <meta httpEquiv="Content-Security-Policy" content={buildCspHeader()} />
      </Head>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <OfflineBanner />
          <AuthProtectedRoute>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#0B0F12" },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
              <Stack.Screen
                name="question/new"
                options={{ presentation: "modal", headerShown: false }}
              />
              <Stack.Screen name="question/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="post/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="user/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="u/[username]" options={{ headerShown: false }} />
              <Stack.Screen
                name="report"
                options={{ presentation: "modal", headerShown: false }}
              />
              <Stack.Screen name="search/index" options={{ headerShown: false }} />
              <Stack.Screen name="community/[slug]" options={{ headerShown: false }} />
              <Stack.Screen
                name="community/new"
                options={{ presentation: "modal", headerShown: false }}
              />
              <Stack.Screen name="bookmarks" options={{ headerShown: false }} />
              <Stack.Screen name="settings/privacy" options={{ headerShown: false }} />
              <Stack.Screen name="settings/edit-profile" options={{ headerShown: false }} />
              <Stack.Screen name="moderation" options={{ headerShown: false }} />
            </Stack>
          </AuthProtectedRoute>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

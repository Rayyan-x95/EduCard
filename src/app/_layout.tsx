import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
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

  // Declared before the effects that call it (react-hooks rule: no
  // use-before-declaration inside effect bodies).
  const onAuthenticated = React.useCallback(async (uid: string) => {
    Analytics.identify(uid);
    NotificationsService.registerForPushNotifications(uid);
    try {
      const profile = await AuthService.getCurrentProfile(uid);
      // Mark as loaded so the INITIAL_SESSION event that follows the
      // getSession() call below does not duplicate this fetch.
      profileLoadedForRef.current = uid;
      setProfile(profile);
    } catch {
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
    Telemetry.init();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        onAuthenticated(session.user.id);
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
      }

      if (session?.user) {
        // Only fetch profile + push registration when the identity is new to
        // this session. TOKEN_REFRESHED (hourly) and repeated events are
        // skipped — the store already holds a valid profile.
        if (profileLoadedForRef.current !== session.user.id) {
          Analytics.identify(session.user.id);
          NotificationsService.registerForPushNotifications(session.user.id);
          try {
            const profile = await AuthService.getCurrentProfile(session.user.id);
            profileLoadedForRef.current = session.user.id;
            setProfile(profile);
          } catch (err) {
            // Keep the previously-known profile so a transient network error
            // doesn't demote an onboarded user back into onboarding. Leave
            // the ref unset so the next auth event retries.
            Telemetry.recordError(err instanceof Error ? err : new Error(String(err)), {
              source: "profileFetch",
            });
          }
        }
      } else {
        Analytics.reset();
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      if (!inAuthGroup) setIsRecoveringPassword(false);
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
    return null;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
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

import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Typography } from "@/components/ui/Typography";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { supabase } from "@/lib/supabase";
import { normalizeError } from "@/lib/errors";
import { AppHaptics } from "@/lib/haptics";
import { Mail, Lock } from "lucide-react-native";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setLoading(true);
    AppHaptics.light();

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        AppHaptics.error();
        setError(normalizeError(authError).message);
      } else {
        AppHaptics.success();
        // Navigation is handled centrally by the auth guard in _layout.tsx.
      }
    } catch (err) {
      AppHaptics.error();
      setError(normalizeError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setOauthLoading(true);
    AppHaptics.light();
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // Web completes in this window; native bounces through the
          // educard:// deep link handled by Expo Linking + supabase PKCE.
          redirectTo:
            typeof window !== "undefined" && typeof document !== "undefined"
              ? window.location.origin
              : "educard://auth-callback",
        },
      });
      if (oauthError) {
        AppHaptics.error();
        setError(normalizeError(oauthError).message);
      }
      // On success the browser redirects; session lands via deep link / URL.
    } catch (err) {
      AppHaptics.error();
      setError(normalizeError(err).message);
    } finally {
      setOauthLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingBottom: 32 }}
        className="px-6 py-8"
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Header with Official EduCard 3D Logo */}
        <View className="items-center mb-8">
          <View className="p-3.5 rounded-3xl bg-primary-container/30 border border-primary/30 items-center justify-center mb-3 shadow-lg shadow-primary/20">
            <Logo variant="full" size="xl" />
          </View>
          <Typography variant="headline-lg" className="text-on-surface text-center mb-1.5 font-extrabold text-3xl">
            EduCard
          </Typography>
          <Typography variant="body-md" className="text-center text-on-surface-variant max-w-[280px] leading-relaxed">
            Ask questions, share what you know, and learn from scholars, alumni, and mentors worldwide.
          </Typography>
        </View>

        {/* Login Card */}
        <Card className="mb-6 p-6 border border-white/[0.08] shadow-xl shadow-black/40">
          <Typography variant="headline-md" className="text-on-surface mb-5 text-xl font-bold">
            Scholar Sign In
          </Typography>

          {error ? (
            <View className="bg-error-container/40 border border-error/50 rounded-xl p-3.5 mb-4 shadow-sm shadow-error/10">
              <Typography variant="label-sm" className="text-error font-semibold normal-case">
                {error}
              </Typography>
            </View>
          ) : null}

          <TextInput
            label="Institutional Email"
            placeholder="scholar@university.edu"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            leftIcon={<Mail size={18} color="#818CF8" />}
          />

          <TextInput
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            leftIcon={<Lock size={18} color="#818CF8" />}
          />

          <Button
            variant="primary"
            size="lg"
            loading={loading}
            onPress={handleLogin}
            className="mt-2"
          >
            Enter Network
          </Button>

          {/* Divider + OAuth */}
          <View className="flex-row items-center my-4">
            <View className="flex-1 h-px bg-outline-variant/40" />
            <Typography variant="label-sm" className="text-on-surface-variant/60 mx-3 normal-case">
              or continue with
            </Typography>
            <View className="flex-1 h-px bg-outline-variant/40" />
          </View>

          <Button
            variant="secondary"
            size="lg"
            loading={oauthLoading}
            onPress={handleGoogleSignIn}
            accessibilityLabel="Sign in with Google"
            className="w-full"
          >
            Continue with Google
          </Button>
        </Card>

        {/* Navigation Links */}
        <View className="flex-row items-center justify-center space-x-1 mb-3">
          <Typography variant="body-sm" className="text-on-surface-variant">
            New to EduCard?
          </Typography>
          <TouchableOpacity
            onPress={() => {
              AppHaptics.light();
              router.push("/(auth)/signup" as any);
            }}
          >
            <Typography variant="body-sm" className="text-primary font-bold ml-1">
              Create Account
            </Typography>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => {
            AppHaptics.light();
            router.push("/(auth)/forgot-password" as any);
          }}
          className="items-center py-2"
        >
          <Typography variant="label-sm" className="text-on-surface-variant/80 font-medium normal-case">
            Forgot your password?
          </Typography>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

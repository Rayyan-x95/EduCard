import React, { useState, useEffect, useRef } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Typography } from "@/components/ui/Typography";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { supabase } from "@/lib/supabase";
import { AuthService } from "@/services/auth";
import { normalizeError } from "@/lib/errors";
import { Analytics } from "@/lib/analytics";
import { AppHaptics } from "@/lib/haptics";
import { Mail, Lock, User, CheckCircle2, Send } from "lucide-react-native";

const RESEND_COOLDOWN_SECONDS = 60;

export default function SignupScreen() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Shown when the project requires email confirmation: signUp succeeds with
  // no session and the user must verify before they can proceed.
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendNote, setResendNote] = useState("");
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startResendCooldown = () => {
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1 && cooldownRef.current) clearInterval(cooldownRef.current);
        return Math.max(0, s - 1);
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendLoading || resendCooldown > 0) return;
    setResendLoading(true);
    setResendNote("");
    try {
      await AuthService.resendConfirmation(email.trim());
      AppHaptics.success();
      setResendNote("Verification email sent again.");
      startResendCooldown();
    } catch (err) {
      AppHaptics.error();
      // Supabase reports its own rate limit here — surface it verbatim via
      // normalizeError so the user knows why nothing arrived.
      setResendNote(normalizeError(err).message);
    } finally {
      setResendLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!displayName || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (displayName.trim().length > 80) {
      setError("Display name must be 80 characters or fewer.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    setError("");
    setLoading(true);
    AppHaptics.light();
    // Fire the funnel-start event when signup actually begins, not (as
    // before) only in the confirmation-required branch at completion.
    Analytics.track("signup_started");

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName.trim(),
          },
        },
      });

      if (authError) {
        AppHaptics.error();
        setError(normalizeError(authError).message);
      } else if (!data.session) {
        // Project has "Confirm email" enabled — surface the check-your-inbox state.
        AppHaptics.success();
        startResendCooldown();
        setAwaitingConfirmation(true);
      } else {
        AppHaptics.success();
        Analytics.track("signup_completed");
        // Navigation is handled centrally by the auth guard in _layout.tsx.
      }
    } catch (err) {
      AppHaptics.error();
      setError(normalizeError(err).message);
    } finally {
      setLoading(false);
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
            Join EduCard
          </Typography>
          <Typography variant="body-md" className="text-center text-on-surface-variant max-w-[280px] leading-relaxed">
            Connect with peers, verified alumni, and mentors across global institutions.
          </Typography>
        </View>

        <Card className="mb-6 p-6 border border-white/[0.08] shadow-xl shadow-black/40">
          <Typography variant="headline-md" className="text-on-surface mb-5 text-xl font-bold">
            Scholar Registration
          </Typography>

          {awaitingConfirmation ? (
            <View className="bg-tertiary-container/25 border border-tertiary/40 rounded-2xl p-4 mb-2">
              <View className="flex-row items-center space-x-2 mb-1.5">
                <CheckCircle2 size={18} color="#34D399" />
                <Typography variant="label-md" className="text-tertiary font-bold normal-case">
                  Confirm your email
                </Typography>
              </View>
              <Typography variant="body-sm" className="text-on-surface-variant/90 leading-relaxed">
                We sent a verification link to {email.trim()}. Confirm your email, then sign in to continue setting up your scholar profile.
              </Typography>

              {resendNote ? (
                <Typography variant="label-sm" className="text-on-surface-variant mt-3 normal-case">
                  {resendNote}
                </Typography>
              ) : null}

              <Button
                variant="secondary"
                size="md"
                className="mt-4"
                leftIcon={<Send size={16} color="#818CF8" />}
                loading={resendLoading}
                disabled={resendCooldown > 0}
                onPress={handleResend}
              >
                {resendCooldown > 0
                  ? `Resend available in ${resendCooldown}s`
                  : "Resend verification email"}
              </Button>

              <Button
                variant="ghost"
                size="md"
                className="mt-2"
                onPress={() => router.replace("/(auth)/login" as any)}
              >
                Go to Sign In
              </Button>
            </View>
          ) : (
            <>
          {error ? (
            <View className="bg-error-container/40 border border-error/50 rounded-xl p-3.5 mb-4 shadow-sm shadow-error/10">
              <Typography variant="label-sm" className="text-error font-semibold normal-case">
                {error}
              </Typography>
            </View>
          ) : null}

          <TextInput
            label="Full Name"
            placeholder="Sarah Chen"
            value={displayName}
            onChangeText={setDisplayName}
            leftIcon={<User size={18} color="#818CF8" />}
          />

          <TextInput
            label="Institutional Email"
            placeholder="scholar@university.edu"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            leftIcon={<Mail size={18} color="#818CF8" />}
            helperText="Use your university domain for verified scholar credentials."
          />

          <TextInput
            label="Password"
            placeholder="At least 8 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            leftIcon={<Lock size={18} color="#818CF8" />}
          />

          <Button
            variant="primary"
            size="lg"
            loading={loading}
            onPress={handleSignup}
            className="mt-3 mb-2"
          >
            Create Scholar Account
          </Button>
            </>
          )}
        </Card>

        <View className="flex-row items-center justify-center space-x-1">
          <Typography variant="body-sm" className="text-on-surface-variant">
            Already registered?
          </Typography>
          <TouchableOpacity
            onPress={() => {
              AppHaptics.light();
              router.push("/(auth)/login" as any);
            }}
          >
            <Typography variant="body-sm" className="text-primary font-bold ml-1">
              Sign In
            </Typography>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

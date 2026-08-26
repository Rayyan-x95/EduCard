import React, { useState } from "react";
import { View, ScrollView } from "react-native";
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
import { CheckCircle2, Lock } from "lucide-react-native";

/**
 * Completes a password recovery started from the forgot-password email.
 * The recovery link redirects into the app (scheme `educard`); the root
 * layout detects the PASSWORD_RECOVERY auth event and routes here.
 */
export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      AppHaptics.success();
      setDone(true);
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
        <Card className="p-6 border border-white/[0.08] shadow-xl shadow-black/40">
          <View className="items-center mb-5">
            <View className="p-3 rounded-2xl bg-primary-container/30 border border-primary/30 items-center justify-center mb-2 shadow-sm shadow-primary/20">
              {done ? (
                <CheckCircle2 size={28} color="#34D399" />
              ) : (
                <Lock size={24} color="#818CF8" />
              )}
            </View>
            <Logo variant="simple" size="md" />
          </View>

          {done ? (
            <>
              <Typography variant="headline-md" className="text-on-surface text-center text-xl font-bold mb-2">
                Password Updated
              </Typography>
              <Typography variant="body-md" className="text-on-surface-variant text-center mb-6 leading-relaxed">
                Your password has been changed. You can now sign in with your new credentials.
              </Typography>
              <Button
                variant="primary"
                size="lg"
                onPress={() => router.replace("/(auth)/login" as any)}
              >
                Continue to Sign In
              </Button>
            </>
          ) : (
            <>
              <Typography variant="headline-md" className="text-on-surface text-xl font-bold mb-2">
                Set a New Password
              </Typography>
              <Typography variant="body-md" className="text-on-surface-variant mb-6 leading-relaxed">
                Choose a strong new password for your scholar account.
              </Typography>

              {error ? (
                <View className="bg-error-container/40 border border-error/50 rounded-xl p-3.5 mb-4 shadow-sm shadow-error/10">
                  <Typography variant="label-sm" className="text-error font-semibold normal-case">
                    {error}
                  </Typography>
                </View>
              ) : null}

              <TextInput
                label="New Password"
                placeholder="At least 8 characters"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TextInput
                label="Confirm New Password"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />

              <Button
                variant="primary"
                size="lg"
                loading={loading}
                onPress={handleReset}
                className="mt-2"
              >
                Update Password
              </Button>
            </>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

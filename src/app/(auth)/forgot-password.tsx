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
import * as Linking from "expo-linking";
import { AppHaptics } from "@/lib/haptics";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react-native";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (!email) {
      setError("Please enter your registered email address.");
      return;
    }
    setError("");
    setLoading(true);
    AppHaptics.light();

    try {
      // The reset email links back into the app via the `educard` scheme.
      // Supabase Auth must allow-list this URL (see docs/OPERATIONS.md).
      const redirectTo = Linking.createURL("/(auth)/reset-password");
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });
      if (resetError) throw resetError;
      AppHaptics.success();
      setSent(true);
    } catch (err) {
      AppHaptics.error();
      setError(normalizeError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="px-5 py-3 border-b border-surface-container-high/80 flex-row items-center">
        <TouchableOpacity
          onPress={() => {
            AppHaptics.light();
            if (router.canGoBack()) router.back(); else router.replace('/(tabs)' as any);
          }}
          className="w-10 h-10 rounded-xl bg-surface-container items-center justify-center border border-outline-variant/60 mr-3 active:bg-surface-container-high"
        >
          <ArrowLeft size={20} color="#F8FAFC" />
        </TouchableOpacity>
        <Typography variant="label-lg" className="text-on-surface font-bold">
          Reset Password
        </Typography>
      </View>

      <ScrollView className="flex-1 px-6 py-8" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 32 }}>
        <Card className="p-6 border border-white/[0.08] shadow-xl shadow-black/40">
          <View className="items-center mb-5">
            <View className="p-3 rounded-2xl bg-primary-container/30 border border-primary/30 items-center justify-center mb-2 shadow-sm shadow-primary/20">
              <Logo variant="simple" size="md" />
            </View>
          </View>

          <Typography variant="headline-md" className="text-on-surface mb-2 text-xl font-bold">
            Account Recovery
          </Typography>
          <Typography variant="body-md" className="text-on-surface-variant mb-6 leading-relaxed">
            Enter your institutional email address to receive password recovery instructions.
          </Typography>

          {sent ? (
            <View className="bg-tertiary-container/25 border border-tertiary/40 rounded-2xl p-4 mb-4 shadow-sm">
              <View className="flex-row items-center space-x-2 mb-1.5">
                <CheckCircle2 size={18} color="#34D399" />
                <Typography variant="label-md" className="text-tertiary font-bold normal-case">
                  Recovery Link Dispatched
                </Typography>
              </View>
              <Typography variant="body-sm" className="text-on-surface-variant/90 leading-relaxed">
                Check your inbox for password reset instructions.
              </Typography>
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
                label="Registered Email"
                placeholder="scholar@university.edu"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                leftIcon={<Mail size={18} color="#818CF8" />}
              />

              <Button
                variant="primary"
                size="lg"
                loading={loading}
                onPress={handleReset}
                className="mt-2"
              >
                Send Reset Link
              </Button>
            </>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

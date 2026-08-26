import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AlertCircle, RefreshCw, Home } from "lucide-react-native";

interface ErrorStateProps {
  title?: string;
  message?: string;
  errorCode?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
}

export function ErrorState({
  title = "Oops! Something went wrong.",
  message = "We encountered an unexpected disruption while trying to access this knowledge node.",
  errorCode,
  onRetry,
  onGoHome,
}: ErrorStateProps) {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center p-6 bg-surface">
      <Card className="w-full max-w-md p-6 items-center text-center relative overflow-hidden bg-surface-container border border-outline-variant/60 shadow-lg shadow-black/40">
        {/* Error Icon Circle with Soft Ambient Red Glow */}
        <View className="w-16 h-16 rounded-full bg-error-container/40 border border-error/30 items-center justify-center mb-5 shadow-sm shadow-error/25">
          <AlertCircle size={32} color="#F87171" />
        </View>

        {/* Title & Message */}
        <Typography variant="headline-md" className="text-on-surface text-center mb-2 font-bold">
          {title}
        </Typography>
        <Typography variant="body-md" className="text-on-surface-variant text-center mb-6 leading-relaxed">
          {message}
        </Typography>

        {/* Error Code Pill — only rendered when the caller supplies a real
            diagnostic; a fabricated default would mislead users/support. */}
        {errorCode && (
          <View className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl py-2.5 px-4 w-full flex-row items-center justify-between mb-6">
            <Typography variant="label-sm" className="text-on-surface-variant/70 uppercase tracking-wider">
              Diagnostic Code
            </Typography>
            <View className="bg-error-container/40 px-2.5 py-0.5 rounded-md border border-error/20">
              <Typography variant="label-sm" className="text-error font-mono font-bold">
                {errorCode}
              </Typography>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View className="w-full space-y-3">
          {onRetry && (
            <Button
              variant="primary"
              size="lg"
              leftIcon={<RefreshCw size={18} color="#0F172A" />}
              onPress={onRetry}
              className="w-full"
            >
              Try Again
            </Button>
          )}

          <Button
            variant="secondary"
            size="lg"
            leftIcon={<Home size={18} color="#818CF8" />}
            onPress={onGoHome || (() => router.replace("/(tabs)" as any))}
            className="w-full"
          >
            Return Home
          </Button>
        </View>
      </Card>
    </View>
  );
}

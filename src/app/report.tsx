import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, Switch, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Typography } from "@/components/ui/Typography";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SafetyService } from "@/services/safety";
import { ReportReasonEnum } from "@/types/database";
import { useAuthStore } from "@/stores/authStore";
import { normalizeError } from "@/lib/errors";
import { Analytics } from "@/lib/analytics";
import { AppHaptics } from "@/lib/haptics";
import { X, Flag, Check } from "lucide-react-native";

/** IDs map 1:1 to the `report_reason_enum` in the database. */
const DETAILED_REASONS: { id: ReportReasonEnum; title: string; subtitle: string }[] = [
  {
    id: "spam",
    title: "Spam or unwanted commercial content",
    subtitle: "Repeated unwanted messages, links, or promotional material.",
  },
  {
    id: "harassment",
    title: "Harassment or bullying",
    subtitle: "Targeted abuse, threats, or aggressive behavior towards others.",
  },
  {
    id: "hate_speech",
    title: "Hate speech or discriminatory content",
    subtitle: "Content attacking people based on protected characteristics.",
  },
  {
    id: "misinformation",
    title: "Misinformation",
    subtitle: "Deliberately false or misleading academic claims.",
  },
  {
    id: "academic_dishonesty",
    title: "Academic dishonesty / cheating",
    subtitle: "Plagiarism, illicit exam sharing, or integrity violations.",
  },
  {
    id: "impersonation",
    title: "Impersonation",
    subtitle: "Pretending to be another person or institution.",
  },
];

export default function ReportModal() {
  const router = useRouter();
  const {
    targetType = "question",
    targetId = "",
    targetUserId = "",
  } = useLocalSearchParams<{
    targetType: string;
    targetId: string;
    targetUserId?: string;
  }>();
  const { user } = useAuthStore();

  const [selectedReason, setSelectedReason] = useState<ReportReasonEnum>("spam");
  const [details, setDetails] = useState("");
  const [blockUser, setBlockUser] = useState(false);
  const [loading, setLoading] = useState(false);

  const validTarget = Boolean(targetId);

  const handleSubmit = async () => {
    if (!user?.id) {
      Alert.alert("Authentication Required", "Please sign in to submit a report.");
      return;
    }
    if (!validTarget) {
      Alert.alert("Cannot Submit", "The content you tried to report could not be identified.");
      return;
    }
    setLoading(true);
    AppHaptics.medium();

    try {
      await SafetyService.reportContent({
        reporterId: user.id,
        targetType: targetType as any,
        targetId,
        reason: selectedReason,
        details: details.trim(),
      });

      if (blockUser && targetUserId) {
        await SafetyService.blockUser(targetUserId, user.id);
        Analytics.track("user_blocked", { blocked_user_id: targetUserId });
      }

      Analytics.track("report_submitted", { reason: selectedReason, target_type: targetType });
      AppHaptics.success();
      Alert.alert(
        "Report Submitted",
        "Thank you for helping keep EduCard a safe and trustworthy academic environment.",
        [{ text: "OK", onPress: () => { if (router.canGoBack()) router.back(); else router.replace("/(tabs)" as any); } }]
      );
    } catch (err) {
      AppHaptics.error();
      Alert.alert("Error", normalizeError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Modal Header */}
      <View className="px-5 py-3.5 border-b border-surface-container-high/80 flex-row items-center justify-between">
        <Typography variant="label-lg" className="text-on-surface font-bold">
          Report Content or Scholar
        </Typography>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Close report form"
          onPress={() => {
            AppHaptics.light();
            if (router.canGoBack()) router.back(); else router.replace('/(tabs)' as any);
          }}
          className="w-10 h-10 rounded-xl bg-surface-container items-center justify-center border border-outline-variant/60 active:bg-surface-container-high"
        >
          <X size={20} color="#F8FAFC" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5 py-5" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 32 }}>
        {!validTarget && (
          <View className="bg-error-container/40 border border-error/50 rounded-xl p-4 mb-5">
            <Typography variant="label-sm" className="text-error font-semibold normal-case">
              Missing content reference â€” please reopen this form from the content you want to report.
            </Typography>
          </View>
        )}

        <Typography variant="body-md" className="text-on-surface-variant mb-5 leading-relaxed">
          Please let us know why you are reporting this content. Your report will be kept confidential and reviewed by our trust team.
        </Typography>

        {/* Radio Reason List */}
        <View className="space-y-3 mb-6">
          {DETAILED_REASONS.map((r) => {
            const isSelected = selectedReason === r.id;
            return (
              <TouchableOpacity
                key={r.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`Report reason: ${r.title}`}
                onPress={() => {
                  AppHaptics.selection();
                  setSelectedReason(r.id);
                }}
                className={`p-4 rounded-2xl border ${
                  isSelected
                    ? "bg-error-container/25 border-error shadow-sm shadow-error/10"
                    : "bg-surface-container border-outline-variant/60 active:bg-surface-container-high"
                }`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-2">
                    <Typography
                      variant="label-md"
                      className={isSelected ? "text-error font-bold" : "text-on-surface font-bold"}
                    >
                      {r.title}
                    </Typography>
                    <Typography variant="label-sm" className="text-on-surface-variant/80 mt-1 leading-snug normal-case">
                      {r.subtitle}
                    </Typography>
                  </View>
                  <View
                    className={`w-5 h-5 rounded-full border items-center justify-center mt-0.5 ${
                      isSelected ? "border-error bg-error" : "border-outline-variant"
                    }`}
                  >
                    {isSelected && <Check size={12} color="#0F172A" strokeWidth={3} />}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Additional Details */}
        <TextInput
          label="Additional Details (Optional)"
          placeholder="Provide any specific context or links to assist our moderators..."
          value={details}
          onChangeText={setDetails}
          multiline
          numberOfLines={4}
          maxLength={1000}
          className="min-h-[90px]"
          containerClassName="mb-6"
        />

        {/* Block User Toggle */}
        <Card className="p-4 mb-8 flex-row items-center justify-between bg-surface-container border border-outline-variant/60 shadow-sm">
          <View className="flex-1 mr-4">
            <Typography variant="label-md" className="text-on-surface font-bold">
              Block this scholar
            </Typography>
            <Typography variant="label-sm" className="text-on-surface-variant/80 mt-0.5 normal-case">
              Their questions and posts will be hidden from your feeds. You can unblock later in Privacy & Account.
            </Typography>
          </View>
          <Switch
            accessibilityLabel="Also block this scholar"
            value={blockUser}
            onValueChange={(val) => {
              AppHaptics.selection();
              setBlockUser(val);
            }}
            trackColor={{ false: "#1E293B", true: "#7F1D1D" }}
            thumbColor={blockUser ? "#F87171" : "#94A3B8"}
          />
        </Card>

        {/* Submit Action */}
        <Button
          variant="danger"
          size="lg"
          loading={loading}
          disabled={!validTarget}
          leftIcon={<Flag size={18} color="#F87171" />}
          onPress={handleSubmit}
          className="mb-6"
        >
          Submit Report
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

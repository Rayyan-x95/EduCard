import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, Alert, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Typography } from "@/components/ui/Typography";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { SafetyService, ModerationReportRow } from "@/services/safety";
import { normalizeError } from "@/lib/errors";
import { AppHaptics } from "@/lib/haptics";
import {
  ArrowLeft,
  Shield,
  Flag,
  Trash2,
  EyeOff,
} from "lucide-react-native";

const REASON_LABELS: Record<string, string> = {
  harassment: "Harassment",
  bullying: "Bullying",
  hate_speech: "Hate speech",
  sexual_content: "Sexual content",
  threats: "Threats",
  self_harm: "Self-harm",
  spam: "Spam",
  scam: "Scam",
  impersonation: "Impersonation",
  misinformation: "Misinformation",
  academic_dishonesty: "Academic dishonesty",
  other: "Other",
};

/** Resolves the (targetType, targetId) pair encoded by the report's exclusive CHECK. */
function resolveTarget(r: ModerationReportRow): { type: string; id: string } | null {
  if (r.post_id) return { type: "post", id: r.post_id };
  if (r.question_id) return { type: "question", id: r.question_id };
  if (r.answer_id) return { type: "answer", id: r.answer_id };
  if (r.comment_id) return { type: "comment", id: r.comment_id };
  if (r.profile_id) return { type: "profile", id: r.profile_id };
  return null;
}

export default function ModerationScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState("");

  const {
    data: reports = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["moderation-queue"],
    queryFn: () => SafetyService.getPendingReports(),
    // RLS makes this an empty list for non-mods; the empty state explains it.
  });

  const actionMutation = useMutation({
    mutationFn: (input: {
      reportId: string;
      targetType: string;
      targetId: string;
      action: "content_removed" | "report_dismissed";
      reason: string;
    }) =>
      SafetyService.executeModerationAction({
        reportId: input.reportId,
        targetType: input.targetType as any,
        targetId: input.targetId,
        action: input.action,
        reason: input.reason,
      }),
    onSuccess: (_data, vars) => {
      AppHaptics.success();
      setActionError("");
      queryClient.invalidateQueries({ queryKey: ["moderation-queue"] });
      Alert.alert(
        vars.action === "content_removed" ? "Content Removed" : "Report Dismissed",
        vars.action === "content_removed"
          ? "The content has been soft-deleted and the reporter's report resolved."
          : "The report was reviewed and dismissed."
      );
    },
    onError: (err) => {
      AppHaptics.error();
      setActionError(normalizeError(err).message);
    },
  });

  const confirmAction = (
    report: ModerationReportRow,
    action: "content_removed" | "report_dismissed"
  ) => {
    const target = resolveTarget(report);
    if (!target) {
      setActionError("Report has no resolvable target.");
      return;
    }
    Alert.alert(
      action === "content_removed" ? "Remove Content?" : "Dismiss Report?",
      action === "content_removed"
        ? "The flagged content will be soft-deleted and this action is audit-logged. Continue?"
        : "This closes the report without removing content. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: action === "content_removed" ? "Remove" : "Dismiss",
          style: action === "content_removed" ? "destructive" : "default",
          onPress: () =>
            actionMutation.mutate({
              reportId: report.id,
              targetType: target.type,
              targetId: target.id,
              action,
              reason:
                action === "content_removed"
                  ? `Removed via moderator dashboard for ${report.reason}`
                  : `Dismissed via moderator dashboard (${report.reason})`,
            }),
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="px-5 py-3 border-b border-surface-container-high/80 flex-row items-center">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => {
            AppHaptics.light();
            if (router.canGoBack()) router.back();
            else router.replace("/(tabs)" as any);
          }}
          className="w-10 h-10 rounded-xl bg-surface-container items-center justify-center border border-outline-variant/60 mr-3 active:bg-surface-container-high"
        >
          <ArrowLeft size={20} color="#F8FAFC" />
        </TouchableOpacity>
        <View>
          <Typography variant="label-lg" className="text-on-surface font-bold">
            Moderation Queue
          </Typography>
          <Typography variant="label-sm" className="text-on-surface-variant/70 normal-case">
            Reports awaiting review
          </Typography>
        </View>
      </View>

      {isError ? (
        <ErrorState
          title="Couldn't load the queue"
          message="Check your connection and try again."
          errorCode="MODERATION_LOAD_FAILED"
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <View className="p-5 space-y-3.5">
          <Skeleton height={140} className="w-full rounded-2xl bg-surface-container" />
          <Skeleton height={140} className="w-full rounded-2xl bg-surface-container" />
        </View>
      ) : reports.length === 0 ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center" }}
          className="px-6 py-12"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#818CF8" />
          }
        >
          <View className="w-16 h-16 rounded-2xl bg-tertiary-container/30 border border-tertiary/40 items-center justify-center mb-4">
            <Shield size={32} color="#34D399" />
          </View>
          <Typography variant="headline-md" className="text-on-surface text-center mb-1.5 font-bold">
            Queue clear
          </Typography>
          <Typography variant="body-md" className="text-on-surface-variant text-center max-w-xs leading-relaxed mb-2 normal-case">
            No pending reports right now — or you may not have moderator access.
          </Typography>
        </ScrollView>
      ) : (
        <ScrollView
          className="flex-1 px-5 py-5"
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#818CF8" />
          }
        >
          {actionError ? (
            <Card className="p-3.5 mb-4 bg-error-container/40 border border-error/50">
              <Typography variant="label-sm" className="text-error font-semibold normal-case">
                {actionError}
              </Typography>
            </Card>
          ) : null}

          {reports.map((r: ModerationReportRow) => {
            const target = resolveTarget(r);
            return (
              <Card key={r.id} className="p-4 mb-4 border border-outline-variant/60 shadow-sm">
                {/* Reason header */}
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center space-x-2">
                    <Flag size={15} color="#F87171" />
                    <Typography variant="label-md" className="text-error font-bold normal-case">
                      {REASON_LABELS[r.reason] ?? r.reason}
                    </Typography>
                  </View>
                  <Badge
                    variant={r.status === "pending" ? "open" : "category"}
                    label={r.status}
                  />
                </View>

                {/* Reporter context */}
                {r.reporter && (
                  <View className="flex-row items-center space-x-2 mb-2">
                    <Avatar
                      name={r.reporter.display_name || "Scholar"}
                      uri={r.reporter.avatar_path}
                      size="sm"
                    />
                    <Typography variant="label-sm" className="text-on-surface-variant/80 normal-case">
                      Reported by @{r.reporter.username || "scholar"} ·{" "}
                      {new Date(r.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </Typography>
                  </View>
                )}

                {/* Details + target */}
                {r.details ? (
                  <Typography variant="body-sm" className="text-on-surface leading-relaxed mb-2">
                    "{r.details}"
                  </Typography>
                ) : null}
                <Typography variant="label-sm" className="text-on-surface-variant/60 normal-case mb-3">
                  Target: {target ? `${target.type} · ${target.id.slice(0, 8)}…` : "unresolvable"}
                </Typography>

                {/* Actions */}
                <View className="flex-row space-x-2.5">
                  <Button
                    variant="danger"
                    size="sm"
                    loading={
                      actionMutation.isPending &&
                      actionMutation.variables?.reportId === r.id &&
                      actionMutation.variables?.action === "content_removed"
                    }
                    leftIcon={<Trash2 size={14} color="#F87171" />}
                    onPress={() => confirmAction(r, "content_removed")}
                    className="flex-1"
                  >
                    Remove
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={
                      actionMutation.isPending &&
                      actionMutation.variables?.reportId === r.id &&
                      actionMutation.variables?.action === "report_dismissed"
                    }
                    leftIcon={<EyeOff size={14} color="#94A3B8" />}
                    onPress={() => confirmAction(r, "report_dismissed")}
                    className="flex-1"
                  >
                    Dismiss
                  </Button>
                </View>
              </Card>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

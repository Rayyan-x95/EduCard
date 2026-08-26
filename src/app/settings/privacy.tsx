import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, Switch, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Typography } from "@/components/ui/Typography";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import * as Application from "expo-application";
import * as Device from "expo-device";
import { InAppBrowser } from "@/lib/browser";
import { normalizeError } from "@/lib/errors";
import { Analytics } from "@/lib/analytics";
import { AppHaptics } from "@/lib/haptics";
import { useAuthStore } from "@/stores/authStore";
import { AuthService } from "@/services/auth";
import { StorageService } from "@/services/storage";
import {
  SafetyService,
  BlockedUser,
  VerificationRequest,
  VerificationType,
} from "@/services/safety";
import { DataExportService } from "@/services/export-data";
import {
  ArrowLeft,
  Eye,
  Bell,
  Shield,
  Download,
  Trash2,
  Smartphone,
  ExternalLink,
  UserX,
  BadgeCheck,
  AlertTriangle,
} from "lucide-react-native";

const VERIFICATION_OPTIONS: { id: VerificationType; label: string; needsEmail: boolean }[] = [
  { id: "student_email", label: "Student Email Verification", needsEmail: true },
  { id: "alumni_diploma", label: "Alumni Diploma", needsEmail: false },
  { id: "professional_id", label: "Professional ID", needsEmail: false },
  { id: "mentor_credential", label: "Mentor Credential", needsEmail: false },
];

export default function PrivacyAccountScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, profile, setProfile, reset } = useAuthStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");

  // Settings State â€” backed by real profiles columns.
  const [publicProfile, setPublicProfile] = useState(profile?.is_public_profile ?? true);
  const [activityStatus, setActivityStatus] = useState(profile?.activity_status ?? false);
  const [dmNotifications, setDmNotifications] = useState(profile?.dm_notifications ?? true);
  const [answerNotifications, setAnswerNotifications] = useState(profile?.answer_notifications ?? true);
  const [weeklyDigest, setWeeklyDigest] = useState(profile?.weekly_digest ?? false);

  // Verification state
  const [selectedVerification, setSelectedVerification] = useState<VerificationType | null>(null);
  const [institutionalEmail, setInstitutionalEmail] = useState("");
  const [verificationError, setVerificationError] = useState("");

  const { data: blockedUsers = [] } = useQuery({
    queryKey: ["blocked-users"],
    queryFn: () => SafetyService.getBlockedUsers(),
    enabled: Boolean(user?.id),
  });

  // Verification request history — users previously submitted blind with no
  // way to see status. RLS scopes this to the owner's own rows.
  const { data: myVerificationRequests = [] } = useQuery({
    queryKey: ["verification-requests"],
    queryFn: () => SafetyService.getMyVerificationRequests(),
    enabled: Boolean(user?.id),
  });

  // Moderator access — surfaces the queue entry point only for staff.
  const { data: isModerator = false } = useQuery({
    queryKey: ["am-i-moderator", user?.id],
    queryFn: () => SafetyService.amIModerator(),
    enabled: Boolean(user?.id),
    staleTime: 5 * 60 * 1000,
  });

  const unblockMutation = useMutation({
    mutationFn: (blockedId: string) => SafetyService.unblockUser(blockedId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blocked-users"] }),
    onError: (err) => Alert.alert("Error", normalizeError(err).message),
  });

  const handleToggle = async (key: string, value: boolean, setter: (val: boolean) => void) => {
    AppHaptics.selection();
    const previous = value;
    setter(value);
    if (!user?.id) return;
    try {
      await AuthService.updateProfileSettings(user.id, { [key]: value });
      if (profile) {
        setProfile({ ...profile, [key]: value } as any);
      }
    } catch (err) {
      setter(!previous);
      Alert.alert("Error", normalizeError(err).message);
    }
  };

  /** Real GDPR export: builds a JSON archive and opens the share sheet. */
  const handleExportData = async () => {
    if (!user?.id) return;
    AppHaptics.light();
    setIsExporting(true);
    setExportMessage("");
    try {
      await DataExportService.exportAndShare(user.id, profile?.username || "");
      setExportMessage("Your data archive was generated and shared.");
    } catch (err) {
      Alert.alert("Export Failed", normalizeError(err).message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = () => {
    AppHaptics.error();
    Alert.alert(
      "Delete Scholar Account",
      "Are you sure you wish to permanently delete your account and all associated reputation points? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Permanently",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await AuthService.deleteAccount();
              Analytics.reset();
              reset();
              router.replace("/(auth)/login" as any);
            } catch (err) {
              Alert.alert("Deletion Error", normalizeError(err).message);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const [evidenceUploading, setEvidenceUploading] = useState(false);
  const [evidencePath, setEvidencePath] = useState<string | null>(null);

  /** Upload a supporting document into the reviewer-only private bucket. */
  const handlePickEvidence = async () => {
    if (!user?.id) return;
    AppHaptics.light();
    try {
      const localUri = await StorageService.pickImage({
        allowsEditing: false,
        quality: 0.85,
      });
      if (!localUri) return;

      setEvidenceUploading(true);
      setVerificationError("");
      // PDFs come through the document picker; images via pickImage.
      let result: { path: string };
      if (localUri.toLowerCase().endsWith(".pdf")) {
        result = await StorageService.uploadVerificationEvidence(user.id, localUri);
      } else {
        result = await StorageService.uploadVerificationEvidence(user.id, localUri);
      }
      setEvidencePath(result.path);
    } catch (err) {
      setVerificationError(normalizeError(err).message);
    } finally {
      setEvidenceUploading(false);
    }
  };

  const submitVerificationMutation = useMutation({
    mutationFn: () =>
      SafetyService.submitVerificationRequest({
        userId: user!.id!,
        verificationType: selectedVerification!,
        institutionalEmail: institutionalEmail.trim() || undefined,
        evidencePath: evidencePath || undefined,
      }),
    onSuccess: () => {
      AppHaptics.success();
      setSelectedVerification(null);
      setInstitutionalEmail("");
      setEvidencePath(null);
      queryClient.invalidateQueries({ queryKey: ["verification-requests"] });
    },
    onError: (err) => setVerificationError(normalizeError(err).message),
  });

  const appVersion = Application.nativeApplicationVersion || "1.0.0";
  const buildVersion = Application.nativeBuildVersion || "1";
  const deviceModel = Device.modelName || Device.osName || "Mobile Device";

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="px-5 py-3 border-b border-surface-container-high/80 flex-row items-center">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => {
            AppHaptics.light();
            if (router.canGoBack()) router.back(); else router.replace('/(tabs)' as any);
          }}
          className="w-10 h-10 rounded-xl bg-surface-container items-center justify-center border border-outline-variant/60 mr-3 active:bg-surface-container-high"
        >
          <ArrowLeft size={20} color="#F8FAFC" />
        </TouchableOpacity>
        <Typography variant="label-lg" className="text-on-surface font-bold">
          Privacy & Account
        </Typography>
      </View>

      <ScrollView className="flex-1 px-5 py-5" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 32 }}>
        <Typography variant="headline-lg" className="text-on-surface mb-1 font-bold text-2xl">
          Privacy & Account
        </Typography>
        <Typography variant="body-md" className="text-on-surface-variant mb-6 leading-relaxed">
          Manage your academic data, discovery visibility, and communication preferences.
        </Typography>

        {/* Visibility Section */}
        <Card className="p-5 mb-5 bg-surface-container border border-outline-variant/60 shadow-sm">
          <SectionHeader icon={<Eye size={18} color="#818CF8" />} title="Visibility" subtitle="Control who can view your credentials and activity." />

          <SettingRow
            title="Public Scholar Profile"
            subtitle="Allow anyone to view your verified answers and badges."
            value={publicProfile}
            onChange={(v) => handleToggle("is_public_profile", v, setPublicProfile)}
          />

          <SettingRow
            last
            title="Show Activity Status"
            subtitle="Let scholars know when you are actively contributing."
            value={activityStatus}
            onChange={(v) => handleToggle("activity_status", v, setActivityStatus)}
          />
        </Card>

        {/* Notifications Section */}
        <Card className="p-5 mb-5 bg-surface-container border border-outline-variant/60 shadow-sm">
          <SectionHeader icon={<Bell size={18} color="#818CF8" />} title="Notification Preferences" subtitle="Select which alerts reach your device." />

          <SettingRow
            title="Answer & Solution Alerts"
            subtitle="Immediate push when your inquiries receive answers or solutions."
            value={answerNotifications}
            onChange={(v) => handleToggle("answer_notifications", v, setAnswerNotifications)}
          />

          <SettingRow
            title="Direct Inquiries & Mentorship"
            subtitle="Alerts when scholars reach out to you directly."
            value={dmNotifications}
            onChange={(v) => handleToggle("dm_notifications", v, setDmNotifications)}
          />

          <SettingRow
            last
            disabled
            title="Weekly Academic Digest"
            subtitle="Coming soon — a summary of top discussions in your spaces."
            value={weeklyDigest}
            onChange={(v) => handleToggle("weekly_digest", v, setWeeklyDigest)}
          />
        </Card>

        {/* Verification Section */}
        <Card className="p-5 mb-5 bg-surface-container border border-outline-variant/60 shadow-sm">
          <SectionHeader
            icon={<BadgeCheck size={18} color="#34D399" />}
            title="Scholar Verification"
            subtitle="Verify your status for the verified badge."
          />

          {profile?.is_verified ? (
            <Badge variant="solved" label="Verified Scholar" />
          ) : (
            <>
              <View className="space-y-2">
                {VERIFICATION_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: selectedVerification === opt.id }}
                    onPress={() => {
                      AppHaptics.selection();
                      setSelectedVerification(opt.id === selectedVerification ? null : opt.id);
                    }}
                    className={`p-3 rounded-xl border ${
                      selectedVerification === opt.id
                        ? "bg-tertiary-container/20 border-tertiary/50"
                        : "bg-surface-container-low border-outline-variant/50"
                    }`}
                  >
                    <Typography variant="label-md" className="text-on-surface font-semibold">
                      {opt.label}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedVerification === "student_email" && (
                <TextInput
                  label="Institutional Email"
                  placeholder="you@university.edu"
                  value={institutionalEmail}
                  onChangeText={setInstitutionalEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  containerClassName="mt-3"
                />
              )}

              {/* Supporting document — stored in the reviewer-only private
                  bucket; never publicly readable (storage RLS). */}
              {selectedVerification && selectedVerification !== "student_email" && (
                <View className="mt-3">
                  {evidencePath ? (
                    <View className="flex-row items-center justify-between px-3.5 py-3 rounded-xl bg-tertiary-container/20 border border-tertiary/40">
                      <Typography variant="label-sm" className="text-tertiary font-semibold normal-case flex-1" numberOfLines={1}>
                        ✓ Document attached
                      </Typography>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Remove attached evidence"
                        onPress={() => {
                          AppHaptics.light();
                          setEvidencePath(null);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={16} color="#F87171" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      loading={evidenceUploading}
                      leftIcon={<Download size={14} color="#818CF8" />}
                      onPress={handlePickEvidence}
                    >
                      Attach supporting document (optional)
                    </Button>
                  )}
                  <Typography variant="label-sm" className="text-on-surface-variant/60 mt-1.5 normal-case">
                    JPG, PNG, WebP or PDF · max 10 MB · visible only to reviewers.
                  </Typography>
                </View>
              )}

              {verificationError ? (
                <Typography variant="label-sm" className="text-error mt-2 normal-case">
                  {verificationError}
                </Typography>
              ) : null}

              <Button
                variant="secondary"
                size="md"
                loading={submitVerificationMutation.isPending}
                disabled={!selectedVerification}
                onPress={() => submitVerificationMutation.mutate()}
                className="mt-3"
              >
                Submit Verification Request
              </Button>
            </>
          )}

          {/* Request history — previously invisible after submission */}
          {myVerificationRequests.length > 0 && (
            <View className="mt-5 pt-4 border-t border-outline-variant/30">
              <Typography variant="label-md" className="text-on-surface font-bold mb-2.5">
                Your Requests
              </Typography>
              {myVerificationRequests.map((v: VerificationRequest) => (
                <View
                  key={v.id}
                  className="flex-row items-center justify-between py-2 border-b border-outline-variant/20 last:border-b-0"
                >
                  <View className="flex-1 mr-3">
                    <Typography variant="label-sm" className="text-on-surface font-semibold normal-case">
                      {VERIFICATION_OPTIONS.find((o) => o.id === v.verification_type)?.label ??
                        v.verification_type}
                    </Typography>
                    <Typography variant="label-sm" className="text-on-surface-variant/60 normal-case">
                      Submitted{" "}
                      {new Date(v.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                      {v.rejection_reason ? ` — ${v.rejection_reason}` : ""}
                    </Typography>
                  </View>
                  <Badge
                    variant={
                      v.status === "verified"
                        ? "solved"
                        : v.status === "rejected" || v.status === "revoked"
                        ? "category"
                        : "open"
                    }
                    label={v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                  />
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Moderator Tools — visible only to staff (is_moderator RPC) */}
        {isModerator && (
          <Card className="p-5 mb-5 bg-surface-container border border-amber/40 shadow-sm">
            <SectionHeader
              icon={<Shield size={18} color="#FBBF24" />}
              title="Moderator Tools"
              subtitle="Review flagged content and take action."
            />
            <Button
              variant="secondary"
              size="md"
              leftIcon={<AlertTriangle size={16} color="#818CF8" />}
              onPress={() => {
                AppHaptics.medium();
                router.push("/moderation" as any);
              }}
            >
              Open Moderation Queue
            </Button>
          </Card>
        )}

        {/* Blocked Users */}
        <Card className="p-5 mb-5 bg-surface-container border border-outline-variant/60 shadow-sm">
          <SectionHeader icon={<UserX size={18} color="#F87171" />} title="Blocked Scholars" subtitle="People you have blocked across the network." />

          {blockedUsers.length === 0 ? (
            <Typography variant="body-sm" className="text-on-surface-variant normal-case">
              You haven't blocked anyone.
            </Typography>
          ) : (
            blockedUsers.map((b: BlockedUser) => (
              <View key={b.blocked_id} className="flex-row items-center justify-between py-2">
                <Avatar name={b.display_name || "Scholar"} uri={b.avatar_path} size="sm" />
                <View className="flex-1 ml-3 mr-2">
                  <Typography variant="label-md" className="text-on-surface font-semibold" numberOfLines={1}>
                    {b.display_name || "Scholar"}
                  </Typography>
                  <Typography variant="label-sm" className="text-on-surface-variant/70 normal-case">
                    {b.username ? `@${b.username}` : ""}
                  </Typography>
                </View>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`Unblock ${b.display_name || "scholar"}`}
                  onPress={() => unblockMutation.mutate(b.blocked_id)}
                  className="px-3 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/50"
                >
                  <Typography variant="label-sm" className="text-primary font-bold normal-case">
                    Unblock
                  </Typography>
                </TouchableOpacity>
              </View>
            ))
          )}
        </Card>

        {/* Legal & In-App Browser Links */}
        <Card className="p-5 mb-5 bg-surface-container border border-outline-variant/60 shadow-sm">
          <Typography variant="headline-sm" className="text-on-surface font-bold mb-3">
            Legal & Trust
          </Typography>

          <TouchableOpacity
            onPress={() => {
              AppHaptics.light();
              InAppBrowser.openUrl("https://educard.app/privacy");
            }}
            className="flex-row items-center justify-between py-3 border-b border-outline-variant/30"
          >
            <Typography variant="label-md" className="text-on-surface font-bold normal-case">
              Privacy Policy
            </Typography>
            <ExternalLink size={16} color="#818CF8" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              AppHaptics.light();
              InAppBrowser.openUrl("https://educard.app/terms");
            }}
            className="flex-row items-center justify-between py-3"
          >
            <Typography variant="label-md" className="text-on-surface font-bold normal-case">
              Terms of Academic Conduct
            </Typography>
            <ExternalLink size={16} color="#818CF8" />
          </TouchableOpacity>
        </Card>

        {/* Data & Account Deletion */}
        <Card className="p-5 mb-5 bg-surface-container border border-outline-variant/60 shadow-sm">
          <SectionHeader icon={<Shield size={18} color="#818CF8" />} title="Data Management" subtitle="Export or permanently erase your profile." />

          {exportMessage ? (
            <Typography variant="label-sm" className="text-tertiary mb-2 normal-case">
              {exportMessage}
            </Typography>
          ) : null}

          <Button
            variant="secondary"
            size="md"
            loading={isExporting}
            leftIcon={<Download size={16} color="#818CF8" />}
            onPress={handleExportData}
            className="mb-3"
          >
            Export My Data (GDPR)
          </Button>

          <Button
            variant="danger"
            size="md"
            loading={isDeleting}
            leftIcon={<Trash2 size={16} color="#F87171" />}
            onPress={handleDeleteAccount}
          >
            Delete Account
          </Button>
        </Card>

        {/* Device Telemetry */}
        <View className="items-center justify-center py-4 mb-4">
          <View className="flex-row items-center space-x-1.5 mb-1">
            <Smartphone size={14} color="#64748B" />
            <Typography variant="label-sm" className="text-on-surface-variant/60 normal-case">
              {deviceModel} â€¢ EduCard v{appVersion} ({buildVersion})
            </Typography>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <View className="flex-row items-center space-x-3 mb-4">
      <View className="p-2.5 bg-primary-container/40 rounded-xl border border-primary/30 shadow-sm shadow-primary/20">
        {icon}
      </View>
      <View className="flex-1">
        <Typography variant="headline-sm" className="text-on-surface font-bold">
          {title}
        </Typography>
        <Typography variant="label-sm" className="text-on-surface-variant/80 normal-case">
          {subtitle}
        </Typography>
      </View>
    </View>
  );
}

function SettingRow({
  title,
  subtitle,
  value,
  onChange,
  last = false,
  disabled = false,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (value: boolean) => void;
  last?: boolean;
  disabled?: boolean;
}) {
  return (
    <View className={`flex-row items-center justify-between py-2.5 ${last ? "" : "border-b border-outline-variant/30 mb-2"}`}>
      <View className="flex-1 mr-3">
        <Typography variant="label-md" className={disabled ? "text-on-surface-variant font-bold" : "text-on-surface font-bold"}>
          {title}
        </Typography>
        <Typography variant="label-sm" className="text-on-surface-variant/80 mt-0.5 normal-case">
          {subtitle}
        </Typography>
      </View>
      <Switch
        accessibilityLabel={title}
        accessibilityHint={disabled ? "Feature coming soon" : undefined}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: "#1E293B", true: "#4338CA" }}
        thumbColor={disabled ? "#64748B" : value ? "#818CF8" : "#94A3B8"}
      />
    </View>
  );
}

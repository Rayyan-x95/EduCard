import React, { useEffect, useRef, useState } from "react";
import { View, ScrollView, TouchableOpacity, Alert, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Typography } from "@/components/ui/Typography";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { QuestionsService } from "@/services/questions";
import { TopicsService } from "@/services/topics";
import { StorageService } from "@/services/storage";
import { CommunitiesService } from "@/services/communities";
import { useAuthStore } from "@/stores/authStore";
import { queryKeys, CACHE_TTL } from "@/lib/query-client";
import {
  saveQuestionDraft,
  readQuestionDraft,
  clearQuestionDraft,
} from "@/lib/question-drafts";
import { AppHaptics } from "@/lib/haptics";
import { Analytics } from "@/lib/analytics";
import {
  X,
  Lightbulb,
  Check,
  Bold,
  Italic,
  Code,
  Link2,
  List,
  Image as ImageIcon,
  Users,
  Sparkles,
  CheckCircle2,
} from "lucide-react-native";

const MAX_ATTACHMENTS = 8;

export default function NewQuestionModal() {
  const router = useRouter();
  // Restored: community-scoped asking. When opened from a Space the question
  // is filed under that community instead of the global feed.
  const { communityId } = useLocalSearchParams<{ communityId?: string }>();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace("/(tabs)" as any);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  const { data: availableTopics = [] } = useQuery({
    queryKey: queryKeys.topics(),
    queryFn: () => TopicsService.getTopics(),
    staleTime: CACHE_TTL.TOPICS,
  });

  const {
    data: targetCommunity,
    isLoading: isCommunityLoading,
    isError: isCommunityError,
  } = useQuery({
    queryKey: ["community-by-id", communityId],
    queryFn: () => CommunitiesService.getCommunityById(communityId as string),
    enabled: Boolean(communityId),
  });

  const [title, setTitle] = useState("");
  const [debouncedTitle, setDebouncedTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTitle(title.trim());
    }, 450);
    return () => clearTimeout(handler);
  }, [title]);

  const { data: similarQuestions = [] } = useQuery({
    queryKey: ["similar-questions", debouncedTitle],
    queryFn: async () => {
      const res = await QuestionsService.findSimilarQuestions(debouncedTitle, 3);
      if (res.length > 0) {
        Analytics.track("duplicate_suggestions_shown", { count: res.length });
      }
      return res;
    },
    enabled: debouncedTitle.length >= 6,
    staleTime: 60 * 1000,
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  // Rebuilt media pipeline: storage paths collected here and persisted via
  // p_image_paths. The detail screen signs these for display — no markdown
  // URLs in the body text (private bucket paths must never leak into copy).
  const [mediaPaths, setMediaPaths] = useState<string[]>([]);

  const handleAttachImage = async () => {
    if (!user?.id) return;
    if (mediaPaths.length >= MAX_ATTACHMENTS) {
      setError(`Maximum ${MAX_ATTACHMENTS} images per question.`);
      return;
    }
    AppHaptics.light();
    try {
      const localUri = await StorageService.pickImage({
        allowsEditing: false,
        quality: 0.85,
      });
      if (!localUri) return;

      setUploadingImage(true);
      const result = await StorageService.uploadAttachment(user.id, localUri);
      setMediaPaths((prev) => [...prev, result.path]);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to attach image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeAttachment = (path: string) => {
    AppHaptics.light();
    setMediaPaths((prev) => prev.filter((p) => p !== path));
    // Best-effort immediate cleanup of the orphaned object
    void StorageService.removeAttachments([path]);
  };

  const navigateAway = () => {
    AppHaptics.light();
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)" as any);
  };

  const handleClose = async () => {
    const isDirty = Boolean(title.trim() || body.trim() || mediaPaths.length > 0);
    if (isDirty && user?.id) {
      Alert.alert(
        "Discard question?",
        "You have unsaved changes. You can keep your draft for later or discard it now.",
        [
          { text: "Keep Draft", onPress: navigateAway },
          {
            text: "Discard",
            style: "destructive",
            onPress: async () => {
              await clearQuestionDraft(user.id);
              if (mediaPaths.length > 0) void StorageService.removeAttachments(mediaPaths);
              navigateAway();
            },
          },
        ]
      );
      return;
    }
    if (mediaPaths.length > 0) void StorageService.removeAttachments(mediaPaths);
    navigateAway();
  };

  // --- Draft auto-save -----------------------------------------------------
  // Debounced local persistence keyed by user; restored on mount after an
  // explicit confirm so an accidental dismiss never silently discards work.
  const draftRestorePromptShown = useRef(false);

  useEffect(() => {
    if (!user?.id || draftRestorePromptShown.current) return;
    draftRestorePromptShown.current = true;
    let cancelled = false;
    void (async () => {
      const draft = await readQuestionDraft(user.id);
      if (cancelled || !draft) return;
      const hasContent = draft.title.trim() || draft.body.trim() || (draft.mediaPaths && draft.mediaPaths.length > 0);
      if (!hasContent) return;
      Alert.alert(
        "Resume draft?",
        `You have an unfinished question from ${new Date(draft.savedAt).toLocaleString()}.`,
        [
          {
            text: "Discard",
            style: "destructive",
            onPress: () => void clearQuestionDraft(user.id!),
          },
          {
            text: "Resume",
            onPress: () => {
              setTitle(draft.title);
              setBody(draft.body);
              setSelectedTopics(draft.topicIds);
              if (draft.mediaPaths && Array.isArray(draft.mediaPaths)) {
                setMediaPaths(draft.mediaPaths);
              }
            },
          },
        ]
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const t = setTimeout(() => {
      void saveQuestionDraft(user.id, {
        title,
        body,
        topicIds: selectedTopics,
        mediaPaths,
        communityId: communityId ?? undefined,
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [title, body, selectedTopics, mediaPaths, communityId, user?.id]);

  const toggleTopic = (id: string) => {
    AppHaptics.selection();
    if (selectedTopics.includes(id)) {
      if (selectedTopics.length > 1) {
        setSelectedTopics(selectedTopics.filter((t) => t !== id));
      }
    } else {
      setSelectedTopics([...selectedTopics, id]);
    }
  };

  const createMutation = useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error("Authentication required");
      if (communityId && !targetCommunity?.id) {
        throw new Error("Selected community could not be found.");
      }
      return QuestionsService.createQuestion({
        title: title.trim(),
        body: body.trim(),
        topic_ids: selectedTopics,
        media_paths: mediaPaths,
        community_id: communityId ? targetCommunity?.id : undefined,
      });
    },
    onSuccess: (newQuestion: { id: string }) => {
      AppHaptics.success();
      if (user?.id) void clearQuestionDraft(user.id);
      queryClient.invalidateQueries({ queryKey: queryKeys.feed("all") });
      queryClient.invalidateQueries({ queryKey: queryKeys.feed("unsolved") });
      router.replace(`/question/${newQuestion.id}` as any);
    },
    onError: (err: any) => {
      AppHaptics.error();
      setError(err.message || "Failed to publish question.");
    },
  });

  const handleSubmit = () => {
    if (createMutation.isPending) return;
    if (communityId) {
      if (isCommunityLoading) return;
      if (isCommunityError || !targetCommunity) {
        setError("Selected community could not be found. Please try again or ask in the global feed.");
        return;
      }
    }
    if (title.trim().length < 10) {
      setError("Title must be at least 10 characters long.");
      return;
    }
    if (body.trim().length < 20) {
      setError("Please provide more context in the details (min 20 characters).");
      return;
    }
    setError("");
    createMutation.mutate();
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-5 py-3.5 border-b border-surface-container-high/80">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          onPress={handleClose}
          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-surface-container items-center justify-center border border-outline-variant/60 active:bg-surface-container-high web:cursor-pointer select-none active:scale-95 transition-transform"
        >
          <X size={20} color="#F8FAFC" />
        </TouchableOpacity>
        <Typography variant="label-lg" className="text-on-surface font-bold">
          Ask a Question
        </Typography>
        <Button
          variant="primary"
          size="sm"
          loading={createMutation.isPending}
          disabled={Boolean(communityId && isCommunityLoading) || createMutation.isPending}
          onPress={handleSubmit}
          className="px-5 py-2"
        >
          Post
        </Button>
      </View>

      <ScrollView className="flex-1 px-5 py-5" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: Math.max(32, insets.bottom + 24) }}>
        {error ? (
          <View className="bg-error-container/40 border border-error/50 rounded-xl p-4 mb-5 shadow-sm shadow-error/10">
            <Typography variant="label-sm" className="text-error font-semibold normal-case">
              {error}
            </Typography>
          </View>
        ) : null}

        {/* Community destination banner — makes scope explicit before posting */}
        {targetCommunity && (
          <View className="flex-row items-center space-x-2.5 mb-5 px-4 py-3 rounded-xl bg-primary-container/25 border border-primary/40">
            <Users size={16} color="#818CF8" />
            <View className="flex-1">
              <Typography variant="label-sm" className="text-on-surface-variant/80 normal-case">
                Posting to
              </Typography>
              <Typography variant="label-md" className="text-primary font-bold" numberOfLines={1}>
                {targetCommunity.name}
              </Typography>
            </View>
          </View>
        )}

        <Typography variant="headline-lg" className="text-on-surface mb-1 font-bold text-2xl">
          What is your question?
        </Typography>
        <Typography variant="body-md" className="text-on-surface-variant mb-6 leading-relaxed">
          Provide details and context so other students can help you.
        </Typography>

        {/* Title Input */}
        <TextInput
          label="Question Title"
          placeholder="e.g. How do I optimize a React component rendering a large WebGL canvas?"
          value={title}
          onChangeText={setTitle}
          maxLength={200}
        />

        {/* Pre-ask similarity suggestions */}
        {similarQuestions.length > 0 && (
          <View className="mb-6 p-4 rounded-2xl bg-surface-container-high/90 border border-primary/40 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center space-x-2">
                <Sparkles size={16} color="#818CF8" />
                <Typography variant="label-md" className="text-on-surface font-bold">
                  Similar questions already asked
                </Typography>
              </View>
              <Typography variant="label-sm" className="text-primary font-semibold normal-case">
                Instant help
              </Typography>
            </View>
            <Typography variant="body-sm" className="text-on-surface-variant mb-3 leading-relaxed">
              Check if your question has already been answered before posting:
            </Typography>
            <View className="space-y-2">
              {similarQuestions.map((sq) => {
                const hasSolution = sq.status === "solved";
                return (
                  <TouchableOpacity
                    key={sq.id}
                    accessibilityRole="button"
                    accessibilityLabel={`View similar question: ${sq.title}`}
                    onPress={() => {
                      AppHaptics.light();
                      Analytics.track("duplicate_suggestion_clicked", { question_id: sq.id });
                      router.push(`/question/${sq.id}` as any);
                    }}
                    className="p-3 rounded-xl bg-surface-container border border-outline-variant/60 active:bg-surface-container-low flex-row items-center justify-between"
                  >
                    <View className="flex-1 mr-2">
                      <Typography variant="label-sm" className="text-on-surface font-semibold" numberOfLines={1}>
                        {sq.title}
                      </Typography>
                      <Typography variant="label-sm" className="text-on-surface-variant/70 normal-case">
                        {sq.answer_count} {sq.answer_count === 1 ? "answer" : "answers"}
                      </Typography>
                    </View>
                    {hasSolution && (
                      <View className="flex-row items-center space-x-1 px-2 py-1 rounded-md bg-tertiary-container/40 border border-tertiary/40">
                        <CheckCircle2 size={12} color="#34D399" />
                        <Typography variant="label-sm" className="text-tertiary font-bold text-[11px] normal-case">
                          Solved
                        </Typography>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Topic Category Chips */}
        <Typography variant="label-md" className="text-on-surface font-bold mb-2.5">
          Select Topics
        </Typography>
        <View className="flex-row flex-wrap gap-2.5 mb-6">
          {availableTopics.map((topic: any) => {
            const isSelected = selectedTopics.includes(topic.id);
            return (
              <TouchableOpacity
                key={topic.id}
                accessibilityRole="button"
                accessibilityLabel={`Topic: ${topic.name}`}
                accessibilityState={{ selected: isSelected }}
                onPress={() => toggleTopic(topic.id)}
                className={`flex-row items-center px-4 py-2 min-h-[44px] rounded-full border web:cursor-pointer select-none active:scale-95 transition-transform ${
                  isSelected
                    ? "bg-primary-container/60 border-primary shadow-sm shadow-primary/20"
                    : "bg-surface-container border-outline-variant/60 active:bg-surface-container-high"
                }`}
              >
                {isSelected && (
                  <View className="mr-1.5">
                    <Check size={14} color="#818CF8" strokeWidth={2.6} />
                  </View>
                )}
                <Typography
                  variant="label-sm"
                  className={isSelected ? "text-primary font-bold normal-case" : "text-on-surface-variant font-medium normal-case"}
                >
                  {topic.name}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Markdown Toolbar & Details Input */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <Typography variant="label-md" className="text-on-surface font-bold">
              Detailed Context
            </Typography>
            <Typography variant="label-sm" className="text-on-surface-variant/70 normal-case font-medium">
              {uploadingImage ? "Uploading attachment..." : "Markdown supported"}
            </Typography>
          </View>

          <View className="bg-surface-container rounded-2xl border border-outline-variant/60 overflow-hidden shadow-sm">
            {/* Formatting Toolbar */}
            <View className="bg-surface-container-high flex-row items-center gap-1.5 px-3 py-2 border-b border-outline-variant/40">
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Format bold"
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                onPress={() => setBody((prev) => prev + " **bold** ")}
                className="w-10 h-10 min-w-[40px] min-h-[40px] items-center justify-center rounded-lg active:bg-surface-container web:cursor-pointer select-none active:scale-90 transition-transform"
              >
                <Bold size={16} color="#818CF8" />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Format italic"
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                onPress={() => setBody((prev) => prev + " *italic* ")}
                className="w-10 h-10 min-w-[40px] min-h-[40px] items-center justify-center rounded-lg active:bg-surface-container web:cursor-pointer select-none active:scale-90 transition-transform"
              >
                <Italic size={16} color="#818CF8" />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Insert code snippet"
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                onPress={() => setBody((prev) => prev + " `code` ")}
                className="w-10 h-10 min-w-[40px] min-h-[40px] items-center justify-center rounded-lg active:bg-surface-container web:cursor-pointer select-none active:scale-90 transition-transform"
              >
                <Code size={16} color="#818CF8" />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Insert bullet list"
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                onPress={() => setBody((prev) => prev + "\n- ")}
                className="w-10 h-10 min-w-[40px] min-h-[40px] items-center justify-center rounded-lg active:bg-surface-container web:cursor-pointer select-none active:scale-90 transition-transform"
              >
                <List size={16} color="#818CF8" />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Insert link"
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                onPress={() => setBody((prev) => prev + " [link](url) ")}
                className="w-10 h-10 min-w-[40px] min-h-[40px] items-center justify-center rounded-lg active:bg-surface-container web:cursor-pointer select-none active:scale-90 transition-transform"
              >
                <Link2 size={16} color="#818CF8" />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Attach image"
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                onPress={handleAttachImage}
                disabled={uploadingImage}
                className="w-10 h-10 min-w-[40px] min-h-[40px] items-center justify-center rounded-lg active:bg-surface-container web:cursor-pointer select-none active:scale-90 transition-transform"
              >
                <ImageIcon size={16} color={uploadingImage ? "#64748B" : "#818CF8"} />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Provide background, what you have tried, and exactly what guidance you need..."
              value={body}
              onChangeText={setBody}
              multiline
              numberOfLines={7}
              textAlignVertical="top"
              className="min-h-[160px] border-0 bg-transparent"
              containerClassName="mb-0"
            />
          </View>

          {/* Attachment thumbnails — paths persisted via p_image_paths and
              rendered as signed URLs on the detail screen. */}
          {mediaPaths.length > 0 && (
            <View className="mt-3">
              <Typography variant="label-sm" className="text-on-surface-variant/70 normal-case mb-2">
                Attachments ({mediaPaths.length}/{MAX_ATTACHMENTS})
              </Typography>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2.5">
                  {mediaPaths.map((p) => (
                    <View key={p} className="relative">
                      <View
                        className="w-20 h-20 rounded-xl bg-surface-container-high border border-outline-variant/60 items-center justify-center"
                      >
                        <ImageIcon size={22} color="#818CF8" />
                      </View>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={`Remove attachment ${p.split("/").pop()}`}
                        onPress={() => removeAttachment(p)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-error border-2 border-surface items-center justify-center"
                      >
                        <X size={12} color="#450A0A" strokeWidth={3} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </ScrollView>
              {uploadingImage && (
                <Typography variant="label-sm" className="text-on-surface-variant/60 normal-case mt-1.5">
                  Uploading image…
                </Typography>
              )}
            </View>
          )}
        </View>

        {/* Who Might Answer Preview */}
        <Card className="p-4 mb-6 bg-surface-container-low border border-outline-variant/60 shadow-sm">
          <View className="flex-row items-center space-x-2.5 mb-2">
            <View className="p-1.5 rounded-lg bg-primary-container/40 border border-primary/30">
              <Lightbulb size={16} color="#818CF8" />
            </View>
            <Typography variant="label-md" className="text-primary font-bold normal-case">
              Who might answer this?
            </Typography>
          </View>
          <Typography variant="body-sm" className="text-on-surface-variant leading-relaxed">
            Your question will be visible to students, alumni, and peers in these topics.
          </Typography>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

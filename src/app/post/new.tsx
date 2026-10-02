import React, { useState, useEffect, useRef } from "react";
import { View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Typography } from "@/components/ui/Typography";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PostsService } from "@/services/posts";
import { TopicsService } from "@/services/topics";
import { StorageService } from "@/services/storage";
import { CommunitiesService } from "@/services/communities";
import { useAuthStore } from "@/stores/authStore";
import { queryKeys, CACHE_TTL } from "@/lib/query-client";
import {
  savePostDraft,
  readPostDraft,
  clearPostDraft,
} from "@/lib/drafts";
import { AppHaptics } from "@/lib/haptics";
import { X, Lightbulb, Check, Image as ImageIcon, Users } from "lucide-react-native";

const MAX_ATTACHMENTS = 8;

export default function NewPostModal() {
  const router = useRouter();
  const { communityId } = useLocalSearchParams<{ communityId?: string }>();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const insets = useSafeAreaInsets();

  const { data: availableTopics = [] } = useQuery({
    queryKey: queryKeys.topics(),
    queryFn: () => TopicsService.getTopics(),
    staleTime: CACHE_TTL.TOPICS,
  });

  const { data: targetCommunity } = useQuery({
    queryKey: ["community-by-id", communityId],
    queryFn: () => CommunitiesService.getCommunityById(communityId as string),
    enabled: Boolean(communityId),
  });

  const [body, setBody] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [mediaPaths, setMediaPaths] = useState<string[]>([]);

  const handleAttachImage = async () => {
    if (!user?.id) return;
    if (mediaPaths.length >= MAX_ATTACHMENTS) {
      setError(`Maximum ${MAX_ATTACHMENTS} images per post.`);
      return;
    }
    AppHaptics.light();
    try {
      const localUri = await StorageService.pickImage({ allowsEditing: false, quality: 0.85 });
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
  };

  const draftRestorePromptShown = useRef(false);

  useEffect(() => {
    if (!user?.id || draftRestorePromptShown.current) return;
    draftRestorePromptShown.current = true;
    let cancelled = false;
    void (async () => {
      const draft = await readPostDraft(user.id);
      if (cancelled || !draft) return;
      const hasContent = draft.body.trim() || (draft.mediaPaths && draft.mediaPaths.length > 0);
      if (!hasContent) return;
      Alert.alert(
        "Resume draft?",
        `You have an unfinished post from ${new Date(draft.savedAt).toLocaleString()}.`,
        [
          {
            text: "Discard",
            style: "destructive",
            onPress: () => void clearPostDraft(user.id!),
          },
          {
            text: "Resume",
            onPress: () => {
              setBody(draft.body);
              if (draft.topicIds && draft.topicIds.length > 0) {
                setSelectedTopics(draft.topicIds);
              }
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
      void savePostDraft(user.id, {
        body,
        topicIds: selectedTopics,
        mediaPaths,
        communityId: communityId ?? undefined,
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [body, selectedTopics, mediaPaths, communityId, user?.id]);

  const toggleTopic = (id: string) => {
    AppHaptics.selection();
    if (selectedTopics.includes(id)) {
      if (selectedTopics.length > 1) setSelectedTopics(selectedTopics.filter((t) => t !== id));
    } else {
      setSelectedTopics([...selectedTopics, id]);
    }
  };

  const createMutation = useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error("Authentication required");
      return PostsService.createPost({
        body: body.trim(),
        topic_ids: selectedTopics,
        media_paths: mediaPaths,
        community_id: communityId ? targetCommunity?.id : undefined,
      });
    },
    onSuccess: (newPost: { id: string }) => {
      AppHaptics.success();
      if (user?.id) void clearPostDraft(user.id);
      queryClient.invalidateQueries({ queryKey: queryKeys.feed("all") });
      queryClient.invalidateQueries({ queryKey: queryKeys.feed("following") });
      if (communityId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.communityPosts(communityId) });
      }
      router.replace(`/post/${newPost.id}` as any);
    },
    onError: async (err: any) => {
      AppHaptics.error();
      setError(err.message || "Failed to publish post.");
      // Do NOT auto-delete uploaded paths on generic failure — user may retry.
      // Orphan cleanup is handled by explicit removal on cancel or by periodic GC.
    },
  });

  const handleSubmit = () => {
    if (createMutation.isPending) return;
    if (body.trim().length < 5) {
      setError("Post must be at least 5 characters.");
      return;
    }
    if (body.trim().length > 5000) {
      setError("Post must be at most 5000 characters.");
      return;
    }
    if (selectedTopics.length === 0) {
      setError("Select at least one topic.");
      return;
    }
    setError("");
    createMutation.mutate();
  };

  const navigateAway = () => {
    AppHaptics.light();
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)" as any);
  };

  const handleClose = async () => {
    const isDirty = Boolean(body.trim() || mediaPaths.length > 0);
    if (isDirty && user?.id && !createMutation.isPending) {
      Alert.alert(
        "Discard post?",
        "You have unsaved changes. You can keep your draft for later or discard it now.",
        [
          { text: "Keep Draft", onPress: navigateAway },
          {
            text: "Discard",
            style: "destructive",
            onPress: async () => {
              await clearPostDraft(user.id);
              if (mediaPaths.length > 0) void StorageService.removeAttachments(mediaPaths);
              navigateAway();
            },
          },
        ]
      );
      return;
    }
    if (mediaPaths.length > 0 && !createMutation.isPending) {
      void StorageService.removeAttachments(mediaPaths);
    }
    navigateAway();
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-row items-center justify-between px-5 py-3.5 border-b border-surface-container-high/80">
        <TouchableOpacity
          onPress={handleClose}
          className="w-10 h-10 rounded-xl bg-surface-container items-center justify-center border border-outline-variant/60 active:bg-surface-container-high"
        >
          <X size={20} color="#F8FAFC" />
        </TouchableOpacity>
        <Typography variant="label-lg" className="text-on-surface font-bold">
          New Post
        </Typography>
        <Button
          variant="primary"
          size="sm"
          loading={createMutation.isPending}
          disabled={createMutation.isPending}
          onPress={handleSubmit}
          className="px-5 py-2"
        >
          Post
        </Button>
      </View>

      <ScrollView className="flex-1 px-5 py-5" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: Math.max(32, insets.bottom + 24) }}>
        {error ? (
          <View className="bg-error-container/40 border border-error/50 rounded-xl p-4 mb-5">
            <Typography variant="label-sm" className="text-error font-semibold normal-case">{error}</Typography>
          </View>
        ) : null}

        {targetCommunity && (
          <View className="flex-row items-center space-x-2.5 mb-5 px-4 py-3 rounded-xl bg-primary-container/25 border border-primary/40">
            <Users size={16} color="#818CF8" />
            <View className="flex-1">
              <Typography variant="label-sm" className="text-on-surface-variant/80 normal-case">Posting to</Typography>
              <Typography variant="label-md" className="text-primary font-bold" numberOfLines={1}>{targetCommunity.name}</Typography>
            </View>
          </View>
        )}

        <Typography variant="headline-lg" className="text-on-surface mb-1 font-bold text-2xl">Share an update</Typography>
        <Typography variant="body-md" className="text-on-surface-variant mb-6 leading-relaxed">Share knowledge, resources, or a discussion prompt with your network.</Typography>

        <TextInput
          label="Post"
          placeholder="What's on your mind? Share a resource, insight, or question for the community..."
          value={body}
          onChangeText={setBody}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          maxLength={5000}
          className="min-h-[140px] border-0 bg-transparent"
          containerClassName="mb-4"
        />
        <Typography variant="label-sm" className="text-on-surface-variant/60 normal-case mb-6 text-right">{body.length}/5000</Typography>

        <Typography variant="label-md" className="text-on-surface font-bold mb-2.5">Select Topics</Typography>
        <View className="flex-row flex-wrap gap-2.5 mb-6">
          {availableTopics.map((topic: any) => {
            const isSelected = selectedTopics.includes(topic.id);
            return (
              <TouchableOpacity
                key={topic.id}
                onPress={() => toggleTopic(topic.id)}
                className={`flex-row items-center px-4 py-2 rounded-full border ${isSelected ? "bg-primary-container/60 border-primary shadow-sm shadow-primary/20" : "bg-surface-container border-outline-variant/60 active:bg-surface-container-high"}`}
              >
                {isSelected && <View className="mr-1.5"><Check size={14} color="#818CF8" strokeWidth={2.6} /></View>}
                <Typography variant="label-sm" className={isSelected ? "text-primary font-bold normal-case" : "text-on-surface-variant font-medium normal-case"}>{topic.name}</Typography>
              </TouchableOpacity>
            );
          })}
        </View>

        <View className="flex-row items-center justify-between mb-3">
          <Typography variant="label-md" className="text-on-surface font-bold">Attachments</Typography>
          <TouchableOpacity onPress={handleAttachImage} disabled={uploadingImage} className="px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/60">
            <View className="flex-row items-center space-x-1.5"><ImageIcon size={16} color={uploadingImage ? "#64748B" : "#818CF8"} /><Typography variant="label-sm" className="text-primary font-semibold normal-case">{uploadingImage ? "Uploading..." : "Add image"}</Typography></View>
          </TouchableOpacity>
        </View>

        {mediaPaths.length > 0 && (
          <View className="mb-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2.5">
                {mediaPaths.map((p) => (
                  <View key={p} className="relative">
                    <View className="w-20 h-20 rounded-xl bg-surface-container-high border border-outline-variant/60 items-center justify-center"><ImageIcon size={22} color="#818CF8" /></View>
                    <TouchableOpacity accessibilityLabel={`Remove attachment ${p.split("/").pop()}`} onPress={() => removeAttachment(p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-error border-2 border-surface items-center justify-center"><X size={12} color="#450A0A" strokeWidth={3} /></TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        <Card className="p-4 mb-6 bg-surface-container-low border border-outline-variant/60 shadow-sm">
          <View className="flex-row items-center space-x-2.5 mb-2">
            <View className="p-1.5 rounded-lg bg-primary-container/40 border border-primary/30"><Lightbulb size={16} color="#818CF8" /></View>
            <Typography variant="label-md" className="text-primary font-bold normal-case">Tips</Typography>
          </View>
          <Typography variant="body-sm" className="text-on-surface-variant leading-relaxed">Posts appear in the home feed alongside questions. Add topics so the right peers discover your update.</Typography>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

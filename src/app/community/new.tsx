import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Typography } from "@/components/ui/Typography";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CommunitiesService } from "@/services/communities";
import { TopicsService } from "@/services/topics";
import { useAuthStore } from "@/stores/authStore";
import { queryKeys } from "@/lib/query-client";
import { AppHaptics } from "@/lib/haptics";
import { X, Users, Shield, Check } from "lucide-react-native";

export default function NewCommunityModal() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: topics = [] } = useQuery({
    queryKey: queryKeys.topics(),
    queryFn: () => TopicsService.getTopics(),
  });

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleNameChange = (text: string) => {
    setName(text);
    // Auto-generate slug from name if not custom edited
    const autoSlug = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setSlug(autoSlug);
  };

  const createMutation = useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error("Authentication required to create a community.");
      if (name.trim().length < 3) throw new Error("Community name must be at least 3 characters.");
      if (description.trim().length < 10) throw new Error("Description must be at least 10 characters.");
      if (!slug.trim()) throw new Error("Valid community URL handle is required.");

      return CommunitiesService.createCommunity({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        rules: rules.trim() || undefined,
        topic_id: selectedTopicId,
      });
    },
    onSuccess: (community) => {
      AppHaptics.success();
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      router.replace(`/community/${community.slug}` as any);
    },
    onError: (err: any) => {
      AppHaptics.error();
      setError(err.message || "Failed to create academic community. Please try again.");
    },
  });

  const isValid = name.trim().length >= 3 && description.trim().length >= 10 && slug.trim().length >= 2;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-5 py-3.5 border-b border-surface-container-high/80">
        <TouchableOpacity
          onPress={() => {
            AppHaptics.light();
            if (router.canGoBack()) router.back();
            else router.replace("/(tabs)" as any);
          }}
          className="w-10 h-10 rounded-xl bg-surface-container items-center justify-center border border-outline-variant/60 active:bg-surface-container-high"
        >
          <X size={20} color="#F8FAFC" />
        </TouchableOpacity>

        <Typography variant="label-lg" className="text-on-surface font-bold">
          Create Academic Space
        </Typography>

        <Button
          variant="primary"
          size="sm"
          disabled={!isValid}
          loading={createMutation.isPending}
          onPress={() => createMutation.mutate()}
          className="px-5 py-2"
        >
          Create
        </Button>
      </View>

      <ScrollView className="flex-1 px-5 py-5" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 32 }}>
        {error ? (
          <View className="bg-error-container/40 border border-error/50 p-4 rounded-xl mb-5 shadow-sm shadow-error/10">
            <Typography variant="label-sm" className="text-error font-semibold normal-case">
              {error}
            </Typography>
          </View>
        ) : null}

        {/* Space Identity Banner */}
        <Card className="p-4 mb-6 bg-surface-container-low border border-primary/30 flex-row items-center space-x-3.5 shadow-sm shadow-primary/10">
          <View className="p-3 bg-primary-container/40 rounded-2xl border border-primary/30 shadow-sm shadow-primary/20">
            <Users size={22} color="#818CF8" />
          </View>
          <View className="flex-1">
            <Typography variant="label-md" className="text-on-surface font-bold">
              Scholarly Circles & Labs
            </Typography>
            <Typography variant="label-sm" className="text-on-surface-variant/80 normal-case mt-0.5">
              Create a dedicated hub for peer reviews, department notes, and research collaboration.
            </Typography>
          </View>
        </Card>

        {/* Space Name */}
        <TextInput
          label="Space Name *"
          placeholder="e.g. Distributed Systems Lab, Quantum Computing Circle"
          value={name}
          onChangeText={handleNameChange}
          containerClassName="mb-4"
        />

        {/* Space URL Handle (Slug) */}
        <TextInput
          label="Space URL Handle (Slug) *"
          placeholder="e.g. distributed-systems"
          value={slug}
          onChangeText={(text) =>
            setSlug(
              text
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, "")
            )
          }
          containerClassName="mb-6"
        />

        {/* Topic Category Selection */}
        <Typography variant="label-md" className="text-on-surface mb-2.5 font-bold">
          Primary Field / Academic Discipline
        </Typography>
        <View className="flex-row flex-wrap gap-2.5 mb-6">
          {topics.map((topic: any) => {
            const isSelected = selectedTopicId === topic.id;
            return (
              <TouchableOpacity
                key={topic.id}
                onPress={() => {
                  AppHaptics.selection();
                  setSelectedTopicId(isSelected ? null : topic.id);
                }}
                className={`flex-row items-center px-4 py-2 rounded-full border ${
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

        {/* Description */}
        <TextInput
          label="Space Purpose & Scope *"
          placeholder="Describe the research focus, study objectives, or departmental criteria for joining this space..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          className="min-h-[100px]"
          containerClassName="mb-6"
        />

        {/* Rules & Guidelines */}
        <TextInput
          label="Community Conduct & Rules (Optional)"
          placeholder="e.g. 1. Respect scholarly debate. 2. Cite academic papers. 3. No plagiarism."
          value={rules}
          onChangeText={setRules}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          className="min-h-[80px]"
          containerClassName="mb-6"
        />

        <View className="flex-row items-center space-x-2 justify-center pb-8 opacity-70">
          <Shield size={14} color="#94A3B8" />
          <Typography variant="label-sm" className="text-on-surface-variant text-center normal-case">
            As creator, you will automatically be assigned moderator privileges.
          </Typography>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

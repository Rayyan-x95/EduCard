import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView as RNScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Typography } from "@/components/ui/Typography";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { AnswerCard, AnswerCardData } from "@/components/domain/AnswerCard";
import { ContributorBadge } from "@/components/domain/ContributorBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { useQuestionDetail } from "@/hooks/useQuestionDetail";
import { StorageService } from "@/services/storage";
import { PostsService, PostComment } from "@/services/posts";
import { QuestionsService } from "@/services/questions";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { AppHaptics } from "@/lib/haptics";
import { ShareService } from "@/lib/sharing";
import { normalizeError } from "@/lib/errors";
import {
  ArrowLeft,
  CheckCircle2,
  MessageSquare,
  Send,
  Sparkles,
  Bold,
  Italic,
  Code,
  List,
  Quote,
  Flag,
  Bookmark,
  Share2,
} from "lucide-react-native";

/**
 * Virtualized question detail. Answers render through FlashList so a
 * viral question with hundreds of answers cannot exhaust memory — only
 * visible rows mount (P0-011). The question body lives in ListHeaderComponent.
 */
export default function QuestionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, profile } = useAuthStore();
  const [commentText, setCommentText] = useState("");

  const {
    question,
    answers,
    isBookmarked,
    qLoading,
    qIsError,
    qRefetch,
    aLoading,
    aIsError,
    refetchAnswers,
    answerText,
    setAnswerText,
    error,
    setError,
    bookmarkMutation,
    createAnswerMutation,
    acceptAnswerMutation,
    reactionMutation,
  } = useQuestionDetail(id);

  const isAuthor = user?.id === question?.author_id;
  const isSolved = question?.status === "solved";

  // Question comments thread (listQuestionComments existed but was never wired up)
  const { data: comments = [] } = useQuery({
    queryKey: ["question-comments", id as string],
    queryFn: () => PostsService.listQuestionComments(id as string),
    enabled: Boolean(id),
  });

  const commentMutation = useMutation({
    mutationFn: () => PostsService.createComment({ questionId: id as string, body: commentText.trim() }),
    onSuccess: () => {
      AppHaptics.success();
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["question-comments", id as string] });
    },
    onError: (err) => setError(normalizeError(err).message),
  });

  // Community name resolution — surfaces the Space a question belongs to.
  const communityId = (question as any)?.community_id as string | null | undefined;
  const { data: communityName } = useQuery({
    queryKey: ["community-name", communityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communities")
        .select("name, slug")
        .eq("id", communityId as string)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(communityId),
  });

  // "Students also asked" — deterministic shared-topic ranking. Fails soft
  // to [] so the rail simply disappears if the RPC is unavailable.
  const { data: relatedQuestions = [] } = useQuery({
    queryKey: ["related-questions", id],
    queryFn: () => QuestionsService.getRelatedQuestions(id as string, 4),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });

  // Signed URLs for private attachment images (attachments bucket is private).
  const attachmentImagePaths = (question as any)?.image_paths as string[] | null | undefined;
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    if (Array.isArray(attachmentImagePaths) && attachmentImagePaths.length > 0) {
      StorageService.getSignedAttachmentUrls(attachmentImagePaths).then((urls) => {
        if (!cancelled) setImageUrls(urls);
      });
    } else {
      setImageUrls([]);
    }
    return () => {
      cancelled = true;
    };
  }, [attachmentImagePaths]);

  if (qLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <HeaderBar
          onBack={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)" as any))}
          questionTitle={undefined}
          id={id}
          isBookmarked={false}
          bookmarkMutation={null}
        />
        <View className="flex-1 px-5 py-5 space-y-4">
          <Skeleton height={28} width="85%" className="bg-surface-container" />
          <Skeleton height={100} className="w-full bg-surface-container" />
        </View>
      </SafeAreaView>
    );
  }

  if (qIsError || !question) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <HeaderBar
          onBack={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)" as any))}
          questionTitle={undefined}
          id={id}
          isBookmarked={isBookmarked}
          bookmarkMutation={bookmarkMutation}
        />
        <View className="flex-1 px-5">
          <ErrorState
            title="Couldn't load this inquiry"
            message="It may have been removed, or the connection dropped."
            errorCode="QUESTION_LOAD_FAILED"
            onRetry={() => qRefetch()}
            onGoHome={() => router.replace("/(tabs)" as any)}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <HeaderBar
          onBack={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)" as any))}
          questionTitle={question.title}
          id={id}
          isBookmarked={isBookmarked}
          bookmarkMutation={bookmarkMutation}
        />
        <FlashList<AnswerCardData>
          data={aLoading || aIsError ? [] : ((answers as AnswerCardData[]) || [])}
          keyExtractor={(item) => item.id}

          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => { qRefetch(); refetchAnswers(); }}
              tintColor="#818CF8"
            />
          }
          ListHeaderComponent={
            <View className="mb-2">
              {/* Solved Status Banner */}
              {isSolved && (
                <View className="flex-row items-center space-x-3 bg-tertiary-container/30 border border-tertiary/40 rounded-2xl px-4 py-3.5 mb-6 shadow-sm shadow-tertiary/10">
                  <CheckCircle2 size={20} color="#34D399" />
                  <View className="flex-1">
                    <Typography variant="label-md" className="font-bold text-tertiary">
                      Verified Scholarly Solution
                    </Typography>
                    <Typography variant="label-sm" className="text-on-surface-variant/90 normal-case">
                      The author and community have verified the accepted solution below.
                    </Typography>
                  </View>
                </View>
              )}

              {/* Question Author Context */}
              <View className="flex-row items-center space-x-3 mb-4">
                <Avatar
                  name={question.profiles?.display_name || "Scholar"}
                  uri={question.profiles?.avatar_path}
                  size="md"
                  role={question.profiles?.current_status || "undergraduate"}
                  isVerified={question.profiles?.is_verified}
                />
                <View className="flex-1">
                  <Typography variant="label-md" className="text-on-surface font-bold">
                    {question.profiles?.display_name || "Scholar"}
                  </Typography>
                  <Typography variant="label-sm" className="text-on-surface-variant/70 font-medium normal-case mt-0.5">
                    {new Date(question.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </Typography>
                </View>

                <ContributorBadge
                  status={question.profiles?.current_status || "undergraduate"}
                  isVerified={question.profiles?.is_verified}
                />
              </View>

              {/* Question Title & Body */}
              <Typography variant="headline-lg" className="text-on-surface mb-3.5 leading-snug font-bold">
                {question.title}
              </Typography>
              <Typography variant="body-lg" className="text-on-surface leading-[30px] mb-4 font-normal">
                {question.body}
              </Typography>

              {/* Community Space badge — tappable, opens the Space */}
              {communityName && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${communityName.name} Space`}
                  onPress={() => {
                    AppHaptics.light();
                    router.push(`/community/${communityName.slug}` as any);
                  }}
                  className="self-start flex-row items-center space-x-1.5 px-3 py-1.5 rounded-full bg-primary-container/30 border border-primary/40 mb-6 active:bg-primary-container/50"
                >
                  <MessageSquare size={13} color="#818CF8" />
                  <Typography variant="label-sm" className="text-primary font-bold normal-case">
                    {communityName.name}
                  </Typography>
                </TouchableOpacity>
              )}

              {/* Attachment Gallery — signed URLs minted at render time */}
              {(attachmentImagePaths?.length ?? 0) > 0 && (
                <RNScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                  <View className="flex-row gap-3">
                    {imageUrls.length === 0
                      ? // Signed URLs still resolving — keep layout stable with placeholders.
                        (attachmentImagePaths ?? []).map((_, idx) => (
                          <Skeleton key={idx} width={180} height={180} className="bg-surface-container rounded-2xl" />
                        ))
                      : imageUrls.map((url, idx) => (
                          <Image
                            key={url}
                            source={{ uri: url }}
                            style={{ width: 180, height: 180, borderRadius: 16 }}
                            contentFit="cover"
                            recyclingKey={url}
                            accessibilityLabel={`Attached image ${idx + 1} of ${imageUrls.length}`}
                            placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
                          />
                        ))}
                  </View>
                </RNScrollView>
              )}

              {/* Answers Header */}
              <View className="flex-row items-center justify-between pt-5 pb-4 border-t border-surface-container-high/80">
                <View className="flex-row items-center space-x-2">
                  <MessageSquare size={18} color="#818CF8" />
                  <Typography variant="headline-sm" className="text-on-surface font-bold">
                    {answers?.length || 0} {answers?.length === 1 ? "Scholarly Answer" : "Scholarly Answers"}
                  </Typography>
                </View>
                <Badge variant="category" label="Verified Peers" />
              </View>

              {aLoading && (
                <View className="space-y-4 mt-4">
                  <Skeleton height={120} className="w-full bg-surface-container" />
                  <Skeleton height={120} className="w-full bg-surface-container" />
                </View>
              )}
              {aIsError && (
                <Card className="p-6 items-center my-4 bg-surface-container border border-error/30">
                  <Typography variant="body-md" className="text-on-surface-variant text-center normal-case mb-4">
                    Couldn&apos;t load answers. Check your connection and try again.
                  </Typography>
                  <Button variant="secondary" size="sm" onPress={() => refetchAnswers()}>
                    Retry
                  </Button>
                </Card>
              )}

              {/* Related questions — "students also asked", ranked by
                  shared-topic overlap. Omitted silently when empty. */}
              {relatedQuestions.length > 0 && (
                <View className="mt-6 pt-5 border-t border-surface-container-high/80">
                  <Typography variant="label-lg" className="text-on-surface font-bold mb-3">
                    Students also asked
                  </Typography>
                  {relatedQuestions.map((rq: any) => (
                    <TouchableOpacity
                      key={rq.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Open related question: ${rq.title}`}
                      onPress={() => {
                        AppHaptics.light();
                        router.push(`/question/${rq.id}` as any);
                      }}
                      className="flex-row items-center justify-between px-3.5 py-3 mb-2 rounded-xl bg-surface-container-low border border-outline-variant/50 active:bg-surface-container"
                    >
                      <View className="flex-1 mr-3">
                        <Typography variant="label-md" className="text-on-surface font-semibold" numberOfLines={2}>
                          {rq.title}
                        </Typography>
                        <Typography variant="label-sm" className="text-on-surface-variant/60 normal-case mt-0.5">
                          {rq.shared_topics} shared topic{rq.shared_topics === 1 ? "" : "s"} ·{" "}
                          {rq.answer_count} answer{rq.answer_count === 1 ? "" : "s"}
                          {rq.status === "solved" ? " · solved" : ""}
                        </Typography>
                      </View>
                      <Badge variant={rq.status === "solved" ? "solved" : "open"} label={rq.status === "solved" ? "Solved" : "Open"} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Discussion Thread — clarifying questions & follow-ups on the inquiry itself */}
              <View className="mt-6 pt-5 border-t border-surface-container-high/80">
                <View className="flex-row items-center space-x-2 mb-3">
                  <MessageSquare size={16} color="#94A3B8" />
                  <Typography variant="label-lg" className="text-on-surface font-bold">
                    Discussion ({comments.length})
                  </Typography>
                </View>

                {comments.length === 0 ? (
                  <Typography variant="body-sm" className="text-on-surface-variant/70 normal-case mb-2">
                    No comments yet. Ask a clarifying question below.
                  </Typography>
                ) : (
                  comments.map((c: PostComment) => (
                    <Card key={c.id} className="p-3.5 mb-2.5 bg-surface-container-low border border-outline-variant/50">
                      <View className="flex-row items-center space-x-2 mb-1.5">
                        <Avatar
                          name={c.author_display_name}
                          uri={c.author_avatar_path}
                          size="sm"
                          role={c.author_status}
                          isVerified={c.author_is_verified}
                        />
                        <Typography variant="label-sm" className="text-on-surface font-bold flex-1" numberOfLines={1}>
                          {c.author_display_name}
                        </Typography>
                        <Typography variant="label-sm" className="text-on-surface-variant/60">
                          {new Date(c.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </Typography>
                      </View>
                      <Typography variant="body-sm" className="text-on-surface leading-relaxed pl-9">
                        {c.body}
                      </Typography>
                    </Card>
                  ))
                )}

                {/* Inline comment composer */}
                <View className="flex-row items-center space-x-2 mt-2">
                  <TextInput
                    placeholder="Ask a clarifying question…"
                    value={commentText}
                    onChangeText={setCommentText}
                    containerClassName="flex-1 mb-0"
                    maxLength={1000}
                    className="py-1.5 text-sm"
                  />
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Post comment"
                    disabled={!user?.id || commentText.trim().length < 1 || commentMutation.isPending}
                    onPress={() => commentMutation.mutate()}
                    className={`w-9 h-9 rounded-full items-center justify-center ${
                      commentText.trim().length >= 1 && user?.id
                        ? "bg-primary"
                        : "bg-surface-container-high border border-outline-variant/40"
                    }`}
                  >
                    <Send
                      size={15}
                      color={commentText.trim().length >= 1 && user?.id ? "#0F172A" : "#64748B"}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          }
          renderItem={({ item: ans }) => (
            <View className="mb-3">
              <AnswerCard
                answer={ans}
                isQuestionAuthor={isAuthor}
                onAcceptPress={(ansId) => acceptAnswerMutation.mutate(ansId)}
                onHelpfulPress={(ansId) => reactionMutation.mutate(ansId)}
                isAccepting={acceptAnswerMutation.isPending}
              />
            </View>
          )}
          ListEmptyComponent={
            !aLoading && !aIsError ? (
              <Card className="p-8 items-center my-4 bg-surface-container border border-outline-variant/60 shadow-md">
                <Sparkles size={32} color="#818CF8" className="mb-2" />
                <Typography variant="label-lg" className="text-on-surface text-center mb-1 font-bold">
                  No answers recorded yet
                </Typography>
                <Typography variant="body-sm" className="text-on-surface-variant text-center max-w-[280px] leading-relaxed">
                  Share your experience or domain expertise below to guide this scholar.
                </Typography>
              </Card>
            ) : null
          }
        />

        {/* Answer Composer Area */}
        <View className="p-4 bg-surface-container-high border-t border-outline-variant/60 shadow-lg">
          {error ? (
            <Typography variant="label-sm" className="text-error mb-2 font-medium">
              {error}
            </Typography>
          ) : null}

          {/* Mini Formatting Toolbar */}
          <View className="flex-row items-center space-x-3.5 mb-2.5 px-1">
            <TouchableOpacity onPress={() => setAnswerText((prev) => prev + " **bold** ")} className="p-1">
              <Bold size={16} color="#94A3B8" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAnswerText((prev) => prev + " *italic* ")} className="p-1">
              <Italic size={16} color="#94A3B8" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAnswerText((prev) => prev + " `code` ")} className="p-1">
              <Code size={16} color="#94A3B8" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAnswerText((prev) => prev + "\n- ")} className="p-1">
              <List size={16} color="#94A3B8" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAnswerText((prev) => prev + "\n> ")} className="p-1">
              <Quote size={16} color="#94A3B8" />
            </TouchableOpacity>

            <View className="flex-1" />
            <Typography variant="label-sm" className="text-on-surface-variant/70 normal-case font-medium">
              @{profile?.username || "scholar"}
            </Typography>
          </View>

          <View className="flex-row items-center space-x-3">
            <TextInput
              placeholder="Provide experienced academic guidance..."
              value={answerText}
              onChangeText={setAnswerText}
              containerClassName="flex-1 mb-0"
              multiline
              maxLength={10000}
              className="max-h-24 py-2"
            />
            <Button
              variant="primary"
              size="md"
              loading={createAnswerMutation.isPending}
              disabled={answerText.trim().length < 10}
              onPress={() => createAnswerMutation.mutate()}
              accessibilityLabel="Post answer"
              className="px-4"
            >
              <Send size={18} color="#0F172A" />
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function HeaderBar({
  onBack,
  questionTitle,
  id,
  isBookmarked,
  bookmarkMutation,
}: {
  onBack: () => void;
  questionTitle: string | undefined;
  id?: string;
  isBookmarked: boolean;
  bookmarkMutation: { mutate: () => void; isPending: boolean } | null;
}) {
  const router = useRouter();
  return (
    <View className="flex-row items-center justify-between px-5 py-3 border-b border-surface-container-high/80">
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => {
          AppHaptics.light();
          onBack();
        }}
        className="w-10 h-10 rounded-xl bg-surface-container items-center justify-center border border-outline-variant/60 active:bg-surface-container-high"
      >
        <ArrowLeft size={20} color="#F8FAFC" />
      </TouchableOpacity>
      <Typography variant="label-lg" className="text-on-surface font-bold">
        Academic Inquiry
      </Typography>
      <View className="flex-row items-center space-x-2">
        <TouchableOpacity
          onPress={() => {
            AppHaptics.light();
            if (questionTitle && id) {
              ShareService.shareQuestion(questionTitle, id);
            }
          }}
          className="w-10 h-10 rounded-xl bg-surface-container items-center justify-center border border-outline-variant/60 active:bg-surface-container-high"
        >
          <Share2 size={18} color="#818CF8" />
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={isBookmarked ? "Remove bookmark" : "Bookmark question"}
          accessibilityState={{ selected: !!isBookmarked }}
          onPress={() => {
            AppHaptics.light();
            if (bookmarkMutation && !bookmarkMutation.isPending) bookmarkMutation.mutate();
          }}
          className="w-10 h-10 rounded-xl bg-surface-container items-center justify-center border border-outline-variant/60 active:bg-surface-container-high"
        >
          <Bookmark
            size={18}
            color={isBookmarked ? "#818CF8" : "#94A3B8"}
            fill={isBookmarked ? "#818CF8" : "none"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Report this question"
          onPress={() => {
            AppHaptics.light();
            router.push({
              pathname: "/report",
              params: { targetType: "question", targetId: id || "", targetUserId: "" },
            } as any);
          }}
          className="w-10 h-10 rounded-xl bg-surface-container items-center justify-center border border-outline-variant/60 active:bg-surface-container-high"
        >
          <Flag size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

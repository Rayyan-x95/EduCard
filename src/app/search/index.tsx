import React, { useState, useEffect } from "react";
import { View, TouchableOpacity } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Typography } from "@/components/ui/Typography";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { SearchService, SearchResults } from "@/services/search";
import {
  getRecentSearches,
  addRecentSearch,
  clearRecentSearches,
} from "@/lib/recent-searches";
import { Analytics } from "@/lib/analytics";
import { AppHaptics } from "@/lib/haptics";
import {
  ArrowLeft,
  Search as SearchIcon,
  HelpCircle,
  CheckCircle2,
  Users,
  WifiOff,
} from "lucide-react-native";

type SearchFilterTab = "top" | "questions" | "people" | "spaces";

const EMPTY: SearchResults = { questions: [], communities: [], profiles: [], topics: [] };

export default function GlobalSearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchFilterTab>("top");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const insets = useSafeAreaInsets();

  // Load recent history once; refreshed after each recorded search.
  useEffect(() => {
    void getRecentSearches().then(setRecentSearches);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  const {
    data: searchResults,
    isLoading: loading,
    isError: failed,
    refetch,
  } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: async () => {
      const trimmed = debouncedQuery.trim();
      const res = await SearchService.searchAll(trimmed);
      void addRecentSearch(trimmed).then(() =>
        getRecentSearches().then(setRecentSearches)
      );
      Analytics.track("search_performed", { query_length: trimmed.length });
      return res;
    },
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 60 * 1000,
  });

  const results = searchResults ?? EMPTY;

  const showQuestions = activeTab === "top" || activeTab === "questions";
  const showPeople = activeTab === "top" || activeTab === "people";
  const showCommunities = activeTab === "top" || activeTab === "spaces";

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Search Header */}
      <View className="px-5 py-3 border-b border-surface-container-high/80 flex-row items-center space-x-3">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => {
            AppHaptics.light();
            if (router.canGoBack()) router.back(); else router.replace('/(tabs)' as any);
          }}
          className="w-10 h-10 rounded-xl bg-surface-container items-center justify-center border border-outline-variant/60 active:bg-surface-container-high"
        >
          <ArrowLeft size={20} color="#F8FAFC" />
        </TouchableOpacity>
        <View className="flex-1">
          <TextInput
            placeholder="Search questions, people, spaces..."
            value={query}
            onChangeText={setQuery}
            autoFocus
            accessibilityLabel="Search queries"
            leftIcon={<SearchIcon size={18} color="#818CF8" />}
            containerClassName="mb-0"
          />
        </View>
      </View>

      {/* Recent searches — shown when the field is empty so returning
          users can re-run prior queries without retyping. */}
      {recentSearches.length > 0 && query.trim().length === 0 && !loading && (
        <View className="px-5 pt-4 pb-1 border-b border-surface-container-high/60">
          <View className="flex-row items-center justify-between mb-2.5">
            <Typography variant="label-md" className="text-on-surface-variant/80 font-bold normal-case">
              Recent searches
            </Typography>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Clear recent searches"
              onPress={() => {
                AppHaptics.light();
                void clearRecentSearches().then(() => setRecentSearches([]));
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Typography variant="label-sm" className="text-primary font-semibold normal-case">
                Clear
              </Typography>
            </TouchableOpacity>
          </View>
          <View className="flex-row flex-wrap gap-2 pb-3">
            {recentSearches.map((s) => (
              <TouchableOpacity
                key={s}
                accessibilityRole="button"
                accessibilityLabel={`Search for ${s}`}
                onPress={() => {
                  AppHaptics.selection();
                  setQuery(s);
                  setDebouncedQuery(s);
                }}
                className="px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/60 active:bg-surface-container-high"
              >
                <Typography variant="label-sm" className="text-on-surface-variant normal-case" numberOfLines={1}>
                  {s}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Filter Tabs */}
      <View className="flex-row px-5 py-3 border-b border-surface-container-high/80 space-x-2">
        {(["top", "questions", "people", "spaces"] as const).map((tab) => {
          const isSelected = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              onPress={() => {
                AppHaptics.selection();
                setActiveTab(tab);
              }}
              className={`px-4 py-1.5 rounded-full border ${
                isSelected
                  ? "bg-primary-container/60 border-primary shadow-sm shadow-primary/20"
                  : "bg-surface-container border-outline-variant/60 active:bg-surface-container-high"
              }`}
            >
              <Typography
                variant="label-sm"
                className={
                  isSelected
                    ? "text-primary font-bold capitalize"
                    : "text-on-surface-variant font-medium capitalize"
                }
              >
                {tab}
              </Typography>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlashList<any>
        data={(() => {
          if (loading || failed) return [];
          const items: any[] = [];
          if ((results.topics?.length ?? 0) > 0) {
            items.push({ type: "topics_header", count: results.topics!.length });
            items.push({ type: "topics", items: results.topics });
          }
          if (showCommunities && results.communities.length > 0) {
            items.push({ type: "communities_header", count: results.communities.length });
            results.communities.forEach((c, i) => items.push({ type: "community", item: c, isLast: i === results.communities.length - 1 }));
          }
          if (showQuestions && results.questions.length > 0) {
            items.push({ type: "questions_header", count: results.questions.length });
            results.questions.forEach((q, i) => items.push({ type: "question", item: q, isLast: i === results.questions.length - 1 }));
          }
          if (showPeople && results.profiles.length > 0) {
            items.push({ type: "people_header", count: results.profiles.length });
            results.profiles.forEach((p, i) => items.push({ type: "profile", item: p, isLast: i === results.profiles.length - 1 }));
          }
          return items;
        })()}
        {...{ estimatedItemSize: 100 } as any}
        getItemType={(item: any) => item.type}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: Math.max(24, insets.bottom + 24) }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={() => {
          if (loading) {
            return (
              <View className="space-y-3">
                <Skeleton height={80} className="w-full rounded-2xl bg-surface-container" />
                <Skeleton height={80} className="w-full rounded-2xl bg-surface-container" />
                <Skeleton height={80} className="w-full rounded-2xl bg-surface-container" />
              </View>
            );
          }
          if (failed) {
            return (
              <View className="items-center py-16">
                <View className="w-16 h-16 rounded-2xl bg-error-container/30 border border-error/40 items-center justify-center mb-4">
                  <WifiOff size={28} color="#F87171" />
                </View>
                <Typography variant="headline-md" className="text-on-surface text-center mb-1 font-bold">
                  Search unavailable
                </Typography>
                <Typography variant="body-md" className="text-on-surface-variant text-center max-w-xs leading-relaxed mb-5">
                  We couldn't complete your search. Check your connection and try again.
                </Typography>
                <Button variant="secondary" size="md" onPress={() => refetch()}>
                  Retry search
                </Button>
              </View>
            );
          }
          if (query.trim().length >= 2) {
            return (
              <View className="items-center py-16">
                <View className="w-16 h-16 rounded-2xl bg-surface-container-high border border-outline-variant/60 items-center justify-center mb-4 shadow-sm">
                  <HelpCircle size={32} color="#818CF8" />
                </View>
                <Typography variant="headline-md" className="text-on-surface text-center mb-1 font-bold">
                  No results found
                </Typography>
                <Typography variant="body-md" className="text-on-surface-variant text-center max-w-xs leading-relaxed">
                  No matching scholars, inquiries, or spaces found for "{query}"
                </Typography>
              </View>
            );
          }
          return null;
        }}
        renderItem={({ item }: { item: any }) => {
          if (item.type === "topics_header") {
            return (
              <Typography variant="label-lg" className="text-amber mb-3 font-bold normal-case">
                Topics ({item.count})
              </Typography>
            );
          }
          if (item.type === "topics") {
            return (
              <View className="mb-6">
                <View className="flex-row flex-wrap gap-2">
                  {item.items.map((t: any) => (
                    <View key={t.id} className="px-3.5 py-2 rounded-full bg-surface-container border border-outline-variant/60">
                      <Typography variant="label-sm" className="text-on-surface font-semibold normal-case">
                        {t.name}
                      </Typography>
                    </View>
                  ))}
                </View>
                <Typography variant="label-sm" className="text-on-surface-variant/60 mt-2.5 normal-case">
                  Tip: use topics when asking a question to reach the right scholars.
                </Typography>
              </View>
            );
          }
          if (item.type === "communities_header") {
            return (
              <Typography variant="label-lg" className="text-tertiary mb-3 font-bold mt-2">
                Academic Spaces ({item.count})
              </Typography>
            );
          }
          if (item.type === "community") {
            const c = item.item;
            return (
              <Card
                onPress={() => {
                  AppHaptics.light();
                  router.push(`/community/${c.slug}` as any);
                }}
                className={`p-4 ${item.isLast ? 'mb-6' : 'mb-3'} bg-surface-container border border-outline-variant/60 shadow-sm`}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Typography variant="headline-sm" className="text-on-surface font-bold">
                    {c.name}
                  </Typography>
                  <Badge variant="category" label="Space" />
                </View>
                <Typography variant="body-sm" className="text-on-surface-variant mb-3 leading-relaxed" numberOfLines={2}>
                  {c.description}
                </Typography>
                <View className="flex-row items-center space-x-1.5">
                  <Users size={13} color="#94A3B8" />
                  <Typography variant="label-sm" className="text-on-surface-variant/70 normal-case font-medium">
                    {(c.member_count ?? 0).toLocaleString()} members
                  </Typography>
                </View>
              </Card>
            );
          }
          if (item.type === "questions_header") {
            return (
              <Typography variant="label-lg" className="text-primary mb-3 font-bold mt-2">
                Questions & Solutions ({item.count})
              </Typography>
            );
          }
          if (item.type === "question") {
            const q = item.item;
            const isSolved = q.status === "solved";
            return (
              <Card
                onPress={() => {
                  AppHaptics.light();
                  router.push(`/question/${q.id}` as any);
                }}
                className={`p-4 ${item.isLast ? 'mb-6' : 'mb-3'} border shadow-sm ${
                  isSolved
                    ? "bg-surface-container-low border-tertiary/40"
                    : "bg-surface-container border-outline-variant/60"
                }`}
              >
                {isSolved && (
                  <View className="flex-row items-center space-x-1.5 mb-2">
                    <CheckCircle2 size={15} color="#34D399" />
                    <Typography variant="label-sm" className="text-tertiary font-bold normal-case">
                      Verified Solution
                    </Typography>
                  </View>
                )}
                <Typography variant="label-lg" className="text-on-surface mb-1.5 font-bold leading-snug">
                  {q.title}
                </Typography>
                <Typography variant="body-sm" className="text-on-surface-variant/90 leading-relaxed" numberOfLines={2}>
                  {q.body}
                </Typography>
              </Card>
            );
          }
          if (item.type === "people_header") {
            return (
              <Typography variant="label-lg" className="text-secondary mb-3 font-bold mt-2">
                Scholars & Mentors ({item.count})
              </Typography>
            );
          }
          if (item.type === "profile") {
            const p = item.item;
            return (
              <Card
                onPress={() => {
                  AppHaptics.light();
                  router.push(`/user/${p.id}` as any);
                }}
                className={`p-3.5 ${item.isLast ? 'mb-6' : 'mb-2.5'} flex-row items-center space-x-3.5 bg-surface-container border border-outline-variant/60 shadow-sm`}
              >
                <Avatar
                  name={p.display_name}
                  uri={p.avatar_path}
                  size="sm"
                  role={p.current_status}
                  isVerified={p.is_verified}
                />
                <View className="flex-1">
                  <Typography variant="label-md" className="text-on-surface font-bold">
                    {p.display_name}
                  </Typography>
                  <Typography variant="label-sm" className="text-on-surface-variant/70 normal-case">
                    @{p.username}
                  </Typography>
                </View>
              </Card>
            );
          }
          return null;
        }}
      />
    </SafeAreaView>
  );
}

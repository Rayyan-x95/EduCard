import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes stale time
      gcTime: 1000 * 60 * 30, // 30 minutes cache time
      retry: (failureCount, error: any) => {
        if (failureCount >= 2) return false;

        // PostgrestError surfaces `code`/`message` but NOT an HTTP `status`,
        // so the previous status-based guard never fired and permanent
        // failures (RLS denials, constraint violations, missing rows) burned
        // their retries. Classify on Postgres/PostgREST codes instead.
        const code: string | undefined = error?.code;
        const message: string = error?.message ?? "";

        if (typeof code === "string") {
          // 23xxx integrity constraints, 42xxx syntax/permission, 42501 RLS,
          // 28xxx auth, PGRST* PostgREST errors — all deterministic.
          if (/^(23|42|42501|28)/.test(code)) return false;
          if (code.startsWith("PGRST")) return false;
        }
        if (/jwt|row-level security/i.test(message)) return false;

        return true;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Standardized Query Key Factories
export const queryKeys = {
  feed: (filter: string) => ["feed", filter] as const,
  question: (id: string) => ["question", id] as const,
  answers: (questionId: string) => ["answers", questionId] as const,
  profile: (userId: string) => ["profile", userId] as const,
  profileByUsername: (username: string) => ["profile-username", username] as const,
  communities: () => ["communities"] as const,
  community: (slug: string) => ["community", slug] as const,
  topics: () => ["topics"] as const,
  notifications: () => ["notifications"] as const,
  unreadNotificationsCount: () => ["notifications", "unread-count"] as const,
  bookmarks: (targetType?: string) => ["bookmarks", targetType || "all"] as const,
  isBookmarked: (targetType: string, id: string) => ["is-bookmarked", targetType, id] as const,
};

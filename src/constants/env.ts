import { z } from "zod";

const EnvSchema = z.object({
  // zod v4 idiom: top-level format validators replace z.string().url().
  EXPO_PUBLIC_SUPABASE_URL: z.url("Invalid Supabase URL"),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Supabase Anon Key is required"),
  EXPO_PUBLIC_POSTHOG_API_KEY: z.string().optional(),
  EXPO_PUBLIC_SENTRY_DSN: z.string().optional(),
});

export const ENV = EnvSchema.parse({
  EXPO_PUBLIC_SUPABASE_URL:
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY:
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  EXPO_PUBLIC_POSTHOG_API_KEY: process.env.EXPO_PUBLIC_POSTHOG_API_KEY,
  EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
});

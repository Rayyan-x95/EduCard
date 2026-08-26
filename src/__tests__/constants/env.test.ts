import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Exercises the REAL src/constants/env.ts module (import-time zod parse,
 * legacy VITE_* fallbacks) instead of a drifted inline copy of its schema.
 * Because the module parses at import time, each case re-imports it with
 * freshly stubbed process.env.
 */

async function importEnv() {
  vi.resetModules();
  return await import("@/constants/env");
}

describe("constants/env (real module)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("parses a complete valid environment", async () => {
    vi.stubEnv("EXPO_PUBLIC_SUPABASE_URL", "https://xyzcompany.supabase.co");
    vi.stubEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY", "valid-anon-key");
    vi.stubEnv("EXPO_PUBLIC_POSTHOG_API_KEY", "phc_123456789");
    vi.stubEnv("EXPO_PUBLIC_SENTRY_DSN", "https://abc@sentry.io/123");

    const { ENV } = await importEnv();
    expect(ENV.EXPO_PUBLIC_SUPABASE_URL).toBe("https://xyzcompany.supabase.co");
    expect(ENV.EXPO_PUBLIC_POSTHOG_API_KEY).toBe("phc_123456789");
  });

  it("succeeds when only the required fields are present", async () => {
    vi.stubEnv("EXPO_PUBLIC_SUPABASE_URL", "https://xyzcompany.supabase.co");
    vi.stubEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY", "valid-anon-key");

    const { ENV } = await importEnv();
    expect(ENV.EXPO_PUBLIC_SUPABASE_ANON_KEY).toBe("valid-anon-key");
    expect(ENV.EXPO_PUBLIC_POSTHOG_API_KEY).toBeUndefined();
  });

  it("honours legacy VITE_ variable names as fallbacks", async () => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    vi.stubEnv("VITE_SUPABASE_URL", "https://legacy-project.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "legacy-key");

    const { ENV } = await importEnv();
    expect(ENV.EXPO_PUBLIC_SUPABASE_URL).toBe("https://legacy-project.supabase.co");
    expect(ENV.EXPO_PUBLIC_SUPABASE_ANON_KEY).toBe("legacy-key");
  });

  it("throws at import time when the Supabase URL is missing or invalid", async () => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.VITE_SUPABASE_URL;
    vi.stubEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY", "some-key");

    // Import-time zod failure is intentional fail-fast behaviour.
    await expect(importEnv()).rejects.toThrow();
  });

  it("throws when the anon key resolves empty", async () => {
    // Remove every possible source first so no earlier stub can leak in.
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    vi.stubEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY", "");

    await expect(importEnv()).rejects.toThrow();
  });
});

import { describe, it, expect, vi } from "vitest";
import { normalizeError } from "../../lib/errors";

// Telemetry touches supabase; stub it out.
vi.mock("@/lib/supabase", () => ({
  supabase: { from: vi.fn().mockReturnValue({ insert: vi.fn().mockResolvedValue({ data: null, error: null }) }) },
}));

describe("normalizeError", () => {
  it("maps invalid login credentials", () => {
    const result = normalizeError(new Error("Invalid login credentials"));
    expect(result.message).toBe("Incorrect email or password.");
  });

  it("maps email-not-confirmed with a stable code", () => {
    const result = normalizeError(new Error("Email not confirmed"));
    expect(result.code).toBe("EMAIL_NOT_CONFIRMED");
    expect(result.message).toMatch(/confirm your email/i);
  });

  it("maps duplicate username constraint to a friendly message", () => {
    const err = { message: 'duplicate key value violates unique constraint "profiles_username_key"', code: "23505" };
    const result = normalizeError(err);
    expect(result.code).toBe("USERNAME_TAKEN");
    expect(result.message).toMatch(/username.*taken/i);
  });

  it("maps RLS violations to a permission message", () => {
    const result = normalizeError(new Error("new row violates row-level security policy"));
    expect(result.code).toBe("FORBIDDEN");
  });

  it("hides unknown provider errors behind generic copy", () => {
    const result = normalizeError(new Error('column "xyz" of relation "profiles" does not exist'));
    expect(result.message).toBe("Something went wrong. Please try again.");
    expect(result.message).not.toMatch(/xyz/);
  });

  it("passes through app-level errors untouched", () => {
    const result = normalizeError(Object.assign(new Error("Please sign in first."), { code: "APP_ERROR" }));
    expect(result.message).toBe("Please sign in first.");
  });

  it("handles null/undefined safely", () => {
    expect(normalizeError(null).message).toBeTruthy();
    expect(normalizeError(undefined).message).toBeTruthy();
  });
});

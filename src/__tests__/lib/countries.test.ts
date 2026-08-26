import { describe, it, expect } from "vitest";
import {
  COUNTRIES,
  normalizeCountryCode,
  isValidCountryCode,
  countryName,
} from "@/lib/countries";
import {
  USERNAME_RE,
  YEAR_MIN,
  YEAR_MAX,
  validateEducationStep,
  usernameHelperText,
} from "@/lib/onboarding";

describe("countries utility", () => {
  it("ships a non-empty ISO catalog with unique codes", () => {
    expect(COUNTRIES.length).toBeGreaterThan(40);
    const codes = COUNTRIES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
    codes.forEach((c) => {
      expect(c).toMatch(/^[A-Z]{2}$/);
    });
  });

  it("normalizes lowercase and whitespace input", () => {
    expect(normalizeCountryCode(" us ")).toBe("US");
    expect(normalizeCountryCode("pk")).toBe("PK");
    expect(normalizeCountryCode("In")).toBe("IN");
  });

  it("returns null for unknown or malformed input", () => {
    expect(normalizeCountryCode("ZZ")).toBeNull();
    expect(normalizeCountryCode("USA")).toBeNull();
    expect(normalizeCountryCode("")).toBeNull();
    expect(normalizeCountryCode("12")).toBeNull();
  });

  it("validates membership correctly", () => {
    expect(isValidCountryCode("US")).toBe(true);
    expect(isValidCountryCode("gb")).toBe(true);
    expect(isValidCountryCode("XX")).toBe(false);
    expect(isValidCountryCode("")).toBe(false);
  });

  it("resolves display names and falls back to the code", () => {
    expect(countryName("US")).toBe("United States");
    expect(countryName("pk")).toBe("Pakistan");
    // Unrecognized code echoes back — never throws.
    expect(countryName("ZZ")).toBe("ZZ");
  });
});

describe("onboarding validation", () => {
  const valid = {
    username: "sarah_chen",
    institutionName: "Stanford University",
    field: "Computer Science",
    degree: "B.S.",
    countryCode: "US",
    startYear: "2022",
  };

  it("accepts a fully valid education step", () => {
    expect(validateEducationStep(valid, isValidCountryCode)).toBe("");
  });

  it("rejects usernames outside the allowed charset/length", () => {
    expect(
      validateEducationStep({ ...valid, username: "ab" }, isValidCountryCode)
    ).toMatch(/Username must be 3–24/);
    expect(
      validateEducationStep({ ...valid, username: "Has Space" }, isValidCountryCode)
    ).toMatch(/Username must be 3–24/);
    expect(USERNAME_RE.test("a".repeat(24))).toBe(true);
    expect(USERNAME_RE.test("a".repeat(25))).toBe(false);
  });

  it("requires institution, field, and degree to be non-empty", () => {
    expect(
      validateEducationStep({ ...valid, institutionName: "" }, isValidCountryCode)
    ).toMatch(/university or institution/i);
    expect(
      validateEducationStep({ ...valid, field: "" }, isValidCountryCode)
    ).toMatch(/field of study/i);
    expect(
      validateEducationStep({ ...valid, degree: "" }, isValidCountryCode)
    ).toMatch(/degree/i);
  });

  it("rejects countries outside the ISO allowlist (no garbage 'ZZ')", () => {
    expect(
      validateEducationStep({ ...valid, countryCode: "ZZ" }, isValidCountryCode)
    ).toMatch(/valid 2-letter code/i);
  });

  it("bounds the start year to the documented range", () => {
    expect(
      validateEducationStep({ ...valid, startYear: "1949" }, isValidCountryCode)
    ).toMatch(new RegExp(`between ${YEAR_MIN}`));
    expect(
      validateEducationStep({ ...valid, startYear: "2101" }, isValidCountryCode)
    ).toMatch(new RegExp(`${YEAR_MAX}\\.`));
    expect(
      validateEducationStep({ ...valid, startYear: "" }, isValidCountryCode)
    ).toMatch(/between/);
    expect(
      validateEducationStep({ ...valid, startYear: "abcd" }, isValidCountryCode)
    ).toMatch(/between/);
  });
});

describe("username helper copy", () => {
  it("maps each status to its user-facing message", () => {
    expect(usernameHelperText("checking")).toMatch(/Checking/i);
    expect(usernameHelperText("taken")).toMatch(/taken/i);
    expect(usernameHelperText("available")).toMatch(/available/i);
    expect(usernameHelperText("idle")).toMatch(/3–24 characters/i);
  });
});

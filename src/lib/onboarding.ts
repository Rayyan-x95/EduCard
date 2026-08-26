import { UserStatusEnum } from "@/types/database";

/** Onboarding form validation + role catalog. Pure logic — unit-testable
 *  without React (P3-035: extracted from the 499-line screen component). */

export const USERNAME_RE = /^[a-z0-9_]{3,24}$/;
export const YEAR_MIN = 1950;
export const YEAR_MAX = 2100;

export interface RoleOption {
  id: UserStatusEnum;
  title: string;
  subtitle: string;
}

export const ROLE_IDS: RoleOption[] = [
  { id: "undergraduate", title: "Student", subtitle: "Currently enrolled in an academic program, seeking knowledge and guidance." },
  { id: "alumni", title: "Alumni", subtitle: "Graduated scholars looking to reconnect, share experiences, and network." },
  { id: "professional", title: "Professional", subtitle: "Industry experts contributing insights and bridging academia and career." },
  { id: "mentor", title: "Mentor / Faculty", subtitle: "Experienced individuals dedicated to guiding and advising the next generation." },
];

export interface EducationStepInput {
  username: string;
  institutionName: string;
  field: string;
  degree: string;
  countryCode: string;
  startYear: string;
}

/**
 * Returns "" when valid; otherwise a user-facing error message.
 * Uses `normalizeCountryCode` from `@/lib/countries` for ISO validation.
 */
export function validateEducationStep(
  input: EducationStepInput,
  isValidCountry: (code: string) => boolean
): string {
  if (!USERNAME_RE.test(input.username.trim())) {
    return "Username must be 3–24 characters using only lowercase letters, numbers, and underscores.";
  }
  if (!input.institutionName.trim()) return "Please enter your university or institution.";
  if (!input.field.trim()) return "Please enter your major or field of study.";
  if (!input.degree.trim()) return "Please enter your degree.";
  if (!isValidCountry(input.countryCode)) {
    return "Country must be a valid 2-letter code (e.g. US, UK, IN, PK).";
  }
  const year = parseInt(input.startYear, 10);
  if (!Number.isFinite(year) || year < YEAR_MIN || year > YEAR_MAX) {
    return `Start year must be between ${YEAR_MIN} and ${YEAR_MAX}.`;
  }
  return "";
}

export type UsernameStatus = "idle" | "checking" | "taken" | "available";

export function usernameHelperText(status: UsernameStatus): string {
  switch (status) {
    case "checking":
      return "Checking availability…";
    case "taken":
      return "That username is taken — try another.";
    case "available":
      return "✓ Username available";
    default:
      return "3–24 characters: lowercase letters, numbers, underscores.";
  }
}

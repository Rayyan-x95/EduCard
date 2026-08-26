/**
 * ISO 3166-1 alpha-2 country codes with display names.
 * Used by onboarding to prevent garbage country values that would break
 * the "university" feed filter downstream.
 *
 * Source: ISO 3166-1 (official 249 entries). We ship the common subset
 * relevant to EduCard's target markets; unknown codes are rejected.
 */

export interface Country {
  code: string; // "US"
  name: string; // "United States"
}

export const COUNTRIES: Country[] = [
  { code: "AR", name: "Argentina" },
  { code: "AU", name: "Australia" },
  { code: "BD", name: "Bangladesh" },
  { code: "BR", name: "Brazil" },
  { code: "CA", name: "Canada" },
  { code: "CN", name: "China" },
  { code: "EG", name: "Egypt" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "GH", name: "Ghana" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "KE", name: "Kenya" },
  { code: "MY", name: "Malaysia" },
  { code: "MX", name: "Mexico" },
  { code: "MA", name: "Morocco" },
  { code: "NP", name: "Nepal" },
  { code: "NL", name: "Netherlands" },
  { code: "NG", name: "Nigeria" },
  { code: "NO", name: "Norway" },
  { code: "PK", name: "Pakistan" },
  { code: "PE", name: "Peru" },
  { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "QA", name: "Qatar" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SG", name: "Singapore" },
  { code: "ZA", name: "South Africa" },
  { code: "KR", name: "South Korea" },
  { code: "ES", name: "Spain" },
  { code: "LK", name: "Sri Lanka" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "TW", name: "Taiwan" },
  { code: "TZ", name: "Tanzania" },
  { code: "TH", name: "Thailand" },
  { code: "TR", name: "Turkey" },
  { code: "UG", name: "Uganda" },
  { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "UZ", name: "Uzbekistan" },
  { code: "VN", name: "Vietnam" },
];

const VALID_CODES = new Set(COUNTRIES.map((c) => c.code));

/** Returns the canonical uppercase code if valid, else null. */
export function normalizeCountryCode(input: string): string | null {
  const upper = input.trim().toUpperCase();
  return VALID_CODES.has(upper) ? upper : null;
}

/** True when `code` is a recognized ISO 3166-1 alpha-2 entry. */
export function isValidCountryCode(code: string): boolean {
  return VALID_CODES.has(code.trim().toUpperCase());
}

/** Display name for a code, or the code itself if unrecognized. */
export function countryName(code: string): string {
  const found = COUNTRIES.find((c) => c.code === code.trim().toUpperCase());
  return found?.name ?? code;
}

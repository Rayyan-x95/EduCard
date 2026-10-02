/**
 * Data Classification & Governance Framework (Phase 9 - Section 11)
 *
 * Defines explicit data classification tiers, retention limits, logging rules,
 * and field-level metadata boundaries across the EduCard academic platform.
 */

export type DataClassificationTier =
  | "PUBLIC"
  | "INTERNAL"
  | "PRIVATE"
  | "SENSITIVE"
  | "RESTRICTED";

export interface DataFieldPolicy {
  tier: DataClassificationTier;
  allowInTelemetry: boolean;
  exportable: boolean;
  anonymizeOnAccountDeletion: boolean;
  description: string;
}

export const DATA_CLASSIFICATION_REGISTRY: Record<string, DataFieldPolicy> = {
  // Public Knowledge Layer
  "question.title": {
    tier: "PUBLIC",
    allowInTelemetry: true,
    exportable: true,
    anonymizeOnAccountDeletion: true,
    description: "Public academic question title",
  },
  "question.content": {
    tier: "PUBLIC",
    allowInTelemetry: false,
    exportable: true,
    anonymizeOnAccountDeletion: true,
    description: "Public academic question markdown body",
  },
  "answer.content": {
    tier: "PUBLIC",
    allowInTelemetry: false,
    exportable: true,
    anonymizeOnAccountDeletion: true,
    description: "Public academic answer markdown body",
  },
  "topic.name": {
    tier: "PUBLIC",
    allowInTelemetry: true,
    exportable: true,
    anonymizeOnAccountDeletion: false,
    description: "Standardized subject/course topic taxonomy",
  },

  // Internal Operational & Aggregate Layer
  "analytics.event_name": {
    tier: "INTERNAL",
    allowInTelemetry: true,
    exportable: false,
    anonymizeOnAccountDeletion: false,
    description: "High-level user interaction event code",
  },
  "moderation.audit_log": {
    tier: "INTERNAL",
    allowInTelemetry: false,
    exportable: false,
    anonymizeOnAccountDeletion: false,
    description: "Staff and community moderator moderation actions",
  },

  // Private Student & Account Layer
  "profile.username": {
    tier: "PUBLIC",
    allowInTelemetry: true,
    exportable: true,
    anonymizeOnAccountDeletion: true,
    description: "Public student or educator handle",
  },
  "profile.full_name": {
    tier: "PRIVATE",
    allowInTelemetry: false,
    exportable: true,
    anonymizeOnAccountDeletion: true,
    description: "Student display name",
  },
  "profile.avatar_url": {
    tier: "PUBLIC",
    allowInTelemetry: false,
    exportable: true,
    anonymizeOnAccountDeletion: true,
    description: "Public avatar image URL",
  },
  "profile.university": {
    tier: "PRIVATE",
    allowInTelemetry: false,
    exportable: true,
    anonymizeOnAccountDeletion: true,
    description: "Enrolled institution / university name",
  },
  "profile.graduation_year": {
    tier: "PRIVATE",
    allowInTelemetry: false,
    exportable: true,
    anonymizeOnAccountDeletion: true,
    description: "Expected degree completion cohort year",
  },
  "user.bookmarks": {
    tier: "PRIVATE",
    allowInTelemetry: false,
    exportable: true,
    anonymizeOnAccountDeletion: true,
    description: "Personal saved questions and posts",
  },

  // Sensitive Personal Data
  "user.email": {
    tier: "SENSITIVE",
    allowInTelemetry: false,
    exportable: true,
    anonymizeOnAccountDeletion: true,
    description: "Primary student authentication email",
  },
  "push.token": {
    tier: "SENSITIVE",
    allowInTelemetry: false,
    exportable: false,
    anonymizeOnAccountDeletion: true,
    description: "Expo push device notification token",
  },

  // Restricted Secrets & Security Infrastructure
  "auth.password_hash": {
    tier: "RESTRICTED",
    allowInTelemetry: false,
    exportable: false,
    anonymizeOnAccountDeletion: true,
    description: "Bcrypt or Argon2 password hash (never stored client-side)",
  },
  "auth.session_token": {
    tier: "RESTRICTED",
    allowInTelemetry: false,
    exportable: false,
    anonymizeOnAccountDeletion: true,
    description: "Supabase JWT session secret",
  },
  "keys.service_role": {
    tier: "RESTRICTED",
    allowInTelemetry: false,
    exportable: false,
    anonymizeOnAccountDeletion: false,
    description: "Backend database service role secret",
  },
};

export const DataClassification = {
  /**
   * Retrieves policy for a given field path.
   */
  getPolicy(fieldKey: string): DataFieldPolicy {
    return (
      DATA_CLASSIFICATION_REGISTRY[fieldKey] ?? {
        tier: "RESTRICTED",
        allowInTelemetry: false,
        exportable: false,
        anonymizeOnAccountDeletion: true,
        description: "Unclassified field (defaults to RESTRICTED least privilege)",
      }
    );
  },

  /**
   * Determines if a field is permitted to be sent in telemetry or logs.
   */
  isSafeForTelemetry(fieldKey: string): boolean {
    return this.getPolicy(fieldKey).allowInTelemetry;
  },

  /**
   * Determines if a field should be included in standard user data export archives.
   */
  isExportable(fieldKey: string): boolean {
    return this.getPolicy(fieldKey).exportable;
  },

  /**
   * Sanitizes an object before logging or telemetry by removing any field
   * classified as PRIVATE, SENSITIVE, or RESTRICTED unless explicitly allowed.
   */
  sanitizeForLogging<T extends Record<string, unknown>>(data: T): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      const policy = this.getPolicy(key);
      if (policy.tier === "PUBLIC" || policy.tier === "INTERNAL") {
        sanitized[key] = value;
      } else {
        sanitized[key] = "[REDACTED]";
      }
    }

    return sanitized;
  },
};

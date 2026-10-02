/**
 * Maps raw Supabase / Postgres / PostgREST errors to safe, human-readable
 * messages. Raw provider messages are logged via Telemetry but never shown
 * to users (they can leak schema details, constraint names, etc.).
 */
import { Telemetry } from "./telemetry";

export type ErrorCategory =
  | "AUTH_ERROR"
  | "NETWORK_ERROR"
  | "DATABASE_ERROR"
  | "RLS_ERROR"
  | "VALIDATION_ERROR"
  | "RATE_LIMIT_ERROR"
  | "STORAGE_ERROR"
  | "REALTIME_ERROR"
  | "PUSH_ERROR"
  | "AI_ERROR"
  | "SEARCH_ERROR"
  | "CLIENT_ERROR"
  | "SERVER_ERROR"
  | "UNKNOWN_ERROR";

export interface NormalizedError {
  message: string;
  /** Stable machine code, useful for branching logic. */
  code?: string;
  /** Categorized domain error for Observability 2.0 taxonomy */
  category?: ErrorCategory;
  /** Error severity rating */
  severity?: "info" | "warning" | "error" | "fatal";
  /** Whether the caller can safely retry this operation */
  retryable?: boolean;
}

type ErrorLike = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
} | null | undefined;

interface FriendlyRule {
  match: RegExp;
  message: string;
  code?: string;
  category: ErrorCategory;
  severity: "info" | "warning" | "error" | "fatal";
  retryable: boolean;
}

const FRIENDLY_MESSAGES: FriendlyRule[] = [
  // Auth
  { match: /invalid login credentials/i, message: "Incorrect email or password.", code: "INVALID_CREDENTIALS", category: "AUTH_ERROR", severity: "info", retryable: false },
  { match: /email not confirmed/i, message: "Please confirm your email address first — check your inbox for the verification link.", code: "EMAIL_NOT_CONFIRMED", category: "AUTH_ERROR", severity: "info", retryable: false },
  { match: /user already registered/i, message: "An account with this email already exists. Try signing in instead.", code: "EMAIL_TAKEN", category: "AUTH_ERROR", severity: "info", retryable: false },
  { match: /rate limit exceeded|too many requests/i, message: "Too many attempts. Please wait a moment and try again.", code: "RATE_LIMITED", category: "RATE_LIMIT_ERROR", severity: "warning", retryable: true },
  { match: /password should be at least/i, message: "Password must be at least 6 characters.", code: "VALIDATION_PASSWORD", category: "VALIDATION_ERROR", severity: "info", retryable: false },
  { match: /same password/i, message: "Your new password must be different from the old one.", code: "VALIDATION_PASSWORD_SAME", category: "VALIDATION_ERROR", severity: "info", retryable: false },
  { match: /refresh token not found|invalid refresh token/i, message: "Your session has expired. Please sign in again.", code: "SESSION_EXPIRED", category: "AUTH_ERROR", severity: "warning", retryable: false },

  // Network
  { match: /network request failed|failed to fetch|network error|timeout/i, message: "Network connection issue. Please check your connection and try again.", code: "NETWORK_TIMEOUT", category: "NETWORK_ERROR", severity: "warning", retryable: true },

  // Unique constraints
  { match: /profiles_username_key|duplicate key.*username/i, message: "This username is already taken. Please choose another one.", code: "USERNAME_TAKEN", category: "VALIDATION_ERROR", severity: "info", retryable: false },
  { match: /communities_slug_key|duplicate key.*slug/i, message: "That space URL handle is already in use. Try another one.", code: "SLUG_TAKEN", category: "VALIDATION_ERROR", severity: "info", retryable: false },
  { match: /uq_user_target_reaction/, message: "You have already reacted to this.", code: "DUPLICATE_REACTION", category: "DATABASE_ERROR", severity: "info", retryable: false },
  { match: /uq_user_target_bookmark/, message: "Could not update your bookmark. Please try again.", code: "DUPLICATE_BOOKMARK", category: "DATABASE_ERROR", severity: "info", retryable: false },
  { match: /uq_verification_requests_open_pending/, message: "You already have a verification request being reviewed.", code: "PENDING_VERIFICATION", category: "VALIDATION_ERROR", severity: "info", retryable: false },
  { match: /chk_no_self_follow/, message: "You cannot follow yourself.", code: "SELF_FOLLOW_FORBIDDEN", category: "VALIDATION_ERROR", severity: "info", retryable: false },
  { match: /chk_no_self_block/, message: "You cannot block yourself.", code: "SELF_BLOCK_FORBIDDEN", category: "VALIDATION_ERROR", severity: "info", retryable: false },

  // Length / check constraints
  { match: /char_length\(title\)|questions_title_check|title.*check/i, message: "Title must be between 10 and 200 characters.", code: "VALIDATION_TITLE", category: "VALIDATION_ERROR", severity: "info", retryable: false },
  { match: /char_length\(body\).*10000|body.*check/i, message: "Message length is outside the allowed range.", code: "VALIDATION_BODY", category: "VALIDATION_ERROR", severity: "info", retryable: false },
  { match: /char_length\(bio\)/i, message: "Bio must be 300 characters or fewer.", code: "VALIDATION_BIO", category: "VALIDATION_ERROR", severity: "info", retryable: false },
  { match: /chk_display_name_length/i, message: "Display name must be 80 characters or fewer.", code: "VALIDATION_DISPLAY_NAME", category: "VALIDATION_ERROR", severity: "info", retryable: false },
  { match: /start_year.*check|end_year.*check/i, message: "Years must be between 1950 and 2100, with the end year after the start year.", code: "VALIDATION_YEAR", category: "VALIDATION_ERROR", severity: "info", retryable: false },
  { match: /value too long for type character varying\(2\)/i, message: "Country must be a 2-letter code (e.g. US, UK, IN).", code: "VALIDATION_COUNTRY", category: "VALIDATION_ERROR", severity: "info", retryable: false },
  { match: /report_reason_enum/i, message: "That report reason is not valid.", code: "VALIDATION_REASON", category: "VALIDATION_ERROR", severity: "info", retryable: false },

  // Action specific security/validation guards
  { match: /cannot accept their own answer/i, message: "You cannot accept your own answer as the solution.", code: "SELF_ACCEPT_FORBIDDEN", category: "VALIDATION_ERROR", severity: "info", retryable: false },
  { match: /cannot react to their own content/i, message: "You cannot react to your own content.", code: "SELF_REACTION_FORBIDDEN", category: "VALIDATION_ERROR", severity: "info", retryable: false },
  { match: /rate limited: please wait/i, message: "You are posting too quickly. Please wait a moment.", code: "RATE_LIMITED", category: "RATE_LIMIT_ERROR", severity: "warning", retryable: true },
  { match: /only platform administrators/i, message: "Platform administrator access required.", code: "ADMIN_REQUIRED", category: "RLS_ERROR", severity: "warning", retryable: false },

  // RLS / permission
  { match: /row-level security|violates row-level/i, message: "You don't have permission to do that.", code: "FORBIDDEN", category: "RLS_ERROR", severity: "warning", retryable: false },
  { match: /42501|permission denied/i, message: "You don't have permission to do that.", code: "FORBIDDEN", category: "RLS_ERROR", severity: "warning", retryable: false },
  { match: /only the question author/i, message: "Only the question author can manage solutions.", code: "FORBIDDEN_AUTHOR_ONLY", category: "RLS_ERROR", severity: "info", retryable: false },
  { match: /moderator or admin privileges required/i, message: "Moderator access required.", code: "FORBIDDEN_MODERATOR_ONLY", category: "RLS_ERROR", severity: "warning", retryable: false },

  // FK violations
  { match: /violates foreign key constraint.*question_id/i, message: "This question no longer exists.", code: "NOT_FOUND_QUESTION", category: "DATABASE_ERROR", severity: "info", retryable: false },
  { match: /violates foreign key constraint/i, message: "The related item no longer exists.", code: "FK_VIOLATION", category: "DATABASE_ERROR", severity: "info", retryable: false },

  // PostgREST schema cache (missing column/table) — indicates deploy drift.
  { match: /could not find the '(.*?)' column/i, message: "This feature is temporarily unavailable. Please update the app.", code: "SCHEMA_DRIFT", category: "SERVER_ERROR", severity: "error", retryable: false },

  // Not found via .single() — content deleted or bad slug. PostgREST
  // reports this through error.code, not the message.
  { match: /PGRST116/i, message: "That content is no longer available.", code: "NOT_FOUND", category: "DATABASE_ERROR", severity: "info", retryable: false },
];

export const APP_ERROR_PREFIX = "APP_";

export function normalizeError(error: unknown): NormalizedError {
  if (!error) {
    return {
      message: "Something went wrong. Please try again.",
      category: "UNKNOWN_ERROR",
      severity: "info",
      retryable: false,
    };
  }

  const e = error as ErrorLike & Record<string, unknown>;
  const rawMessage = typeof e.message === "string" ? e.message : String(error);

  // Already a friendly app-level error (thrown by services/screens with
  // codes prefixed APP_). Pass straight through.
  if (typeof e.code === "string" && e.code.startsWith(APP_ERROR_PREFIX)) {
    return {
      message: rawMessage,
      code: e.code,
      category: "CLIENT_ERROR",
      severity: "info",
      retryable: false,
    };
  }

  for (const rule of FRIENDLY_MESSAGES) {
    // Rules may key off either the human-readable message or the provider's
    // machine code (e.g. PostgREST reports PGRST116 only via code).
    const codeHit = typeof e.code === "string" && rule.match.test(e.code);
    if (rule.match.test(rawMessage) || codeHit) {
      return {
        message: rule.message,
        code: rule.code ?? e.code,
        category: rule.category,
        severity: rule.severity,
        retryable: rule.retryable,
      };
    }
  }

  // Unknown provider error: log full detail server-side, show generic copy.
  Telemetry.recordError(error instanceof Error ? error : new Error(rawMessage), {
    source: "normalizeError",
    supabaseCode: e.code,
    supabaseDetails: e.details,
    supabaseHint: e.hint,
    category: "UNKNOWN_ERROR",
  });

  return {
    message: "Something went wrong. Please try again.",
    code: e.code,
    category: "UNKNOWN_ERROR",
    severity: "error",
    retryable: false,
  };
}


/**
 * Maps raw Supabase / Postgres / PostgREST errors to safe, human-readable
 * messages. Raw provider messages are logged via Telemetry but never shown
 * to users (they can leak schema details, constraint names, etc.).
 */
import { Telemetry } from "./telemetry";

interface NormalizedError {
  message: string;
  /** Stable machine code, useful for branching logic. */
  code?: string;
}

type ErrorLike = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
} | null | undefined;

const FRIENDLY_MESSAGES: { match: RegExp; message: string; code?: string }[] = [
  // Auth
  { match: /invalid login credentials/i, message: "Incorrect email or password." },
  { match: /email not confirmed/i, message: "Please confirm your email address first — check your inbox for the verification link.", code: "EMAIL_NOT_CONFIRMED" },
  { match: /user already registered/i, message: "An account with this email already exists. Try signing in instead.", code: "EMAIL_TAKEN" },
  { match: /rate limit exceeded|too many requests/i, message: "Too many attempts. Please wait a moment and try again.", code: "RATE_LIMITED" },
  { match: /password should be at least/i, message: "Password must be at least 6 characters." },
  { match: /same password/i, message: "Your new password must be different from the old one." },
  { match: /refresh token not found|invalid refresh token/i, message: "Your session has expired. Please sign in again.", code: "SESSION_EXPIRED" },

  // Unique constraints
  { match: /profiles_username_key|duplicate key.*username/i, message: "This username is already taken. Please choose another one.", code: "USERNAME_TAKEN" },
  { match: /communities_slug_key|duplicate key.*slug/i, message: "That space URL handle is already in use. Try another one.", code: "SLUG_TAKEN" },
  { match: /uq_user_target_reaction/, message: "You have already reacted to this.", code: "DUPLICATE_REACTION" },
  { match: /uq_user_target_bookmark/, message: "Could not update your bookmark. Please try again.", code: "DUPLICATE_BOOKMARK" },
  { match: /uq_verification_requests_open_pending/, message: "You already have a verification request being reviewed.", code: "PENDING_VERIFICATION" },
  { match: /chk_no_self_follow/, message: "You cannot follow yourself." },
  { match: /chk_no_self_block/, message: "You cannot block yourself." },

  // Length / check constraints
  { match: /char_length\(title\)|questions_title_check|title.*check/i, message: "Title must be between 10 and 200 characters.", code: "VALIDATION_TITLE" },
  { match: /char_length\(body\).*10000|body.*check/i, message: "Message length is outside the allowed range.", code: "VALIDATION_BODY" },
  { match: /char_length\(bio\)/i, message: "Bio must be 300 characters or fewer." },
  { match: /chk_display_name_length/i, message: "Display name must be 80 characters or fewer." },
  { match: /start_year.*check|end_year.*check/i, message: "Years must be between 1950 and 2100, with the end year after the start year.", code: "VALIDATION_YEAR" },
  { match: /value too long for type character varying\(2\)/i, message: "Country must be a 2-letter code (e.g. US, UK, IN).", code: "VALIDATION_COUNTRY" },
  { match: /report_reason_enum/i, message: "That report reason is not valid.", code: "VALIDATION_REASON" },

  // RLS / permission
  { match: /row-level security|violates row-level/i, message: "You don't have permission to do that.", code: "FORBIDDEN" },
  { match: /42501|permission denied/i, message: "You don't have permission to do that.", code: "FORBIDDEN" },
  { match: /only the question author/i, message: "Only the question author can manage solutions." },
  { match: /moderator or admin privileges required/i, message: "Moderator access required." },

  // FK violations
  { match: /violates foreign key constraint.*question_id/i, message: "This question no longer exists.", code: "NOT_FOUND_QUESTION" },
  { match: /violates foreign key constraint/i, message: "The related item no longer exists.", code: "FK_VIOLATION" },

  // PostgREST schema cache (missing column/table) — indicates deploy drift.
  { match: /could not find the '(.*?)' column/i, message: "This feature is temporarily unavailable. Please update the app.", code: "SCHEMA_DRIFT" },

  // Not found via .single() — content deleted or bad slug. PostgREST
  // reports this through error.code, not the message.
  { match: /PGRST116/i, message: "That content is no longer available.", code: "NOT_FOUND" },
];

export const APP_ERROR_PREFIX = "APP_";

export function normalizeError(error: unknown): NormalizedError {
  if (!error) {
    return { message: "Something went wrong. Please try again." };
  }

  const e = error as ErrorLike & Record<string, unknown>;
  const rawMessage = typeof e.message === "string" ? e.message : String(error);

  // Already a friendly app-level error (thrown by services/screens with
  // codes prefixed APP_). Pass straight through.
  if (typeof e.code === "string" && e.code.startsWith(APP_ERROR_PREFIX)) {
    return { message: rawMessage };
  }

  for (const rule of FRIENDLY_MESSAGES) {
    // Rules may key off either the human-readable message or the provider's
    // machine code (e.g. PostgREST reports PGRST116 only via code).
    const codeHit = typeof e.code === "string" && rule.match.test(e.code);
    if (rule.match.test(rawMessage) || codeHit) {
      return { message: rule.message, code: rule.code ?? e.code };
    }
  }

  // Unknown provider error: log full detail server-side, show generic copy.
  Telemetry.recordError(error instanceof Error ? error : new Error(rawMessage), {
    source: "normalizeError",
    supabaseCode: e.code,
    supabaseDetails: e.details,
    supabaseHint: e.hint,
  });

  return { message: "Something went wrong. Please try again.", code: e.code };
}

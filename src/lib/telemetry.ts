import { ENV } from "@/constants/env";
import { supabase } from "@/lib/supabase";

export type TelemetryLogLevel = "debug" | "info" | "warning" | "error" | "fatal";

export interface TelemetryBreadcrumb {
  timestamp: string;
  category: string;
  message: string;
  level?: TelemetryLogLevel;
  data?: Record<string, any>;
}

export interface TelemetryContext {
  userId?: string;
  screen?: string;
  action?: string;
  extra?: Record<string, any>;
}

const isDev =
  typeof __DEV__ !== "undefined" ? __DEV__ : process.env.NODE_ENV !== "production";

/** Errors are debounced per fingerprint to avoid flooding the backend. */
const REPORT_COOLDOWN_MS = 60_000;
const recentFingerprints = new Map<string, number>();

class TelemetryService {
  private breadcrumbs: TelemetryBreadcrumb[] = [];
  private readonly maxBreadcrumbs = 50;
  private currentContext: TelemetryContext = {};
  private appVersion: string | null = null;
  private platform: string | null = null;

  init(options?: { appVersion?: string; platform?: string }) {
    this.appVersion = options?.appVersion ?? null;
    this.platform = options?.platform ?? null;
    if (isDev) {
      console.log(
        `[Telemetry] Initialized (remote reporting ${ENV.EXPO_PUBLIC_SENTRY_DSN || ENV.EXPO_PUBLIC_POSTHOG_API_KEY ? "enabled" : "disabled — no keys configured"}).`
      );
    }
  }

  setUserContext(userId: string | null, additionalInfo?: Record<string, any>) {
    if (userId) {
      this.currentContext.userId = userId;
      if (additionalInfo) {
        this.currentContext.extra = { ...this.currentContext.extra, ...additionalInfo };
      }
    } else {
      delete this.currentContext.userId;
    }
  }

  addBreadcrumb(
    category: string,
    message: string,
    data?: Record<string, any>,
    level: TelemetryLogLevel = "info"
  ) {
    const breadcrumb: TelemetryBreadcrumb = {
      timestamp: new Date().toISOString(),
      category,
      message,
      level,
      data,
    };

    this.breadcrumbs.push(breadcrumb);
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }

    if (isDev) {
      console.log(`[Telemetry Breadcrumb] [${category}] ${message}`, data || "");
    }
  }

   private fingerprint(error: Error): string {
    // Include top frames + message to survive minified Hermes stacks where file names are lost.
    const frames = error.stack
      ?.split("\n")
      .slice(1, 4)
      .map((l) => l.trim().slice(0, 120))
      .join("|") ?? "";
    return `${error.name}:${error.message.slice(0, 120)}:${frames}`.slice(0, 300);
  }

  /** Fire-and-forget Sentry envelope via REST so no native SDK is required. */
  private sendToSentry(error: Error, fingerprint: string, context: Record<string, any>) {
    const dsn = ENV.EXPO_PUBLIC_SENTRY_DSN;
    if (!dsn) return;
    try {
      // Sentry DSN: https://<key>@<host>/<projectId>
      const match = dsn.match(/^https:\/\/([^@]+)@([^/]+)\/(\d+)/);
      if (!match) return;
      const [, key, host, projectId] = match;
      const payload = {
        timestamp: Date.now() / 1000,
        platform: "javascript",
        message: `${error.name}: ${error.message}`.slice(0, 2000),
        exception: { values: [{ type: error.name, value: error.message, stacktrace: { frames: [{ filename: "app", function: fingerprint.slice(0, 100) }] } }] },
        tags: { fingerprint: fingerprint.slice(0, 100) },
        extra: context,
        breadcrumbs: this.breadcrumbs.slice(-10),
        environment: isDev ? "development" : "production",
      };
      void fetch(`https://${host}/api/${projectId}/store/?sentry_key=${key}&sentry_version=7`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});
    } catch {
      // Sentry transport must never break caller
    }
  }

  /**
   * Records an error locally AND persists it to `client_error_reports`
   * so production failures are diagnosable. Fire-and-forget: never throws.
   */
  recordError(error: unknown, context?: Record<string, any>) {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    const fingerprint = this.fingerprint(normalizedError);

    const payload = {
      name: normalizedError.name,
      message: normalizedError.message.slice(0, 2000),
      stack: normalizedError.stack?.slice(0, 8000),
      context: { ...this.currentContext, ...context },
      recentBreadcrumbs: [...this.breadcrumbs],
      timestamp: new Date().toISOString(),
    };

    console.error("[Telemetry: Exception Captured]", payload);

    // Forward to Sentry first (no cooldown — Sentry does dedup server-side).
    this.sendToSentry(normalizedError, fingerprint, payload.context as Record<string, any>);

    // Cooldown duplicate reports of the same crash site.
    const now = Date.now();
    const last = recentFingerprints.get(fingerprint);
    if (last && now - last < REPORT_COOLDOWN_MS) return;
    recentFingerprints.set(fingerprint, now);

    try {
      void supabase
        .from("client_error_reports")
        .insert({
          user_id: this.currentContext.userId ?? null,
          message: `${normalizedError.name}: ${normalizedError.message}`.slice(0, 2000),
          stack: normalizedError.stack?.slice(0, 8000),
          fingerprint,
          context: payload.context as Record<string, any>,
          breadcrumbs: payload.recentBreadcrumbs as unknown as Record<string, any>[],
          app_version: this.appVersion,
          platform: this.platform,
        })
        .then(
          ({ error }) => {
            if (error && isDev) {
              console.warn("[Telemetry] Failed to persist error report:", error.message);
            }
          },
          (err: unknown) => {
            if (isDev) console.warn("[Telemetry] Error report transport failed:", err);
          }
        );
    } catch (transportError) {
      // Reporting must never break the caller that experienced the error.
      if (isDev) console.warn("[Telemetry] Error report dispatch failed:", transportError);
    }
  }

  captureMessage(message: string, level: TelemetryLogLevel = "info", context?: Record<string, any>) {
    if (isDev || level === "error" || level === "fatal") {
      console.log(`[Telemetry: ${level.toUpperCase()}] ${message}`, context || "");
    }
    if (level === "fatal") {
      this.recordError(new Error(message), context);
    }
  }

  getRecentBreadcrumbs(): TelemetryBreadcrumb[] {
    return [...this.breadcrumbs];
  }
}

export const Telemetry = new TelemetryService();

import { ENV } from "@/constants/env";

export type AnalyticsEvent =
  | "app_opened"
  | "signup_started"
  | "signup_completed"
  | "onboarding_completed"
  | "question_created"
  | "answer_created"
  | "answer_accepted"
  | "helpful_voted"
  | "community_created"
  | "community_joined"
  | "search_performed"
  | "report_submitted"
  | "user_blocked";

const POSTHOG_HOST = "https://us.i.posthog.com";

const isDev =
  typeof __DEV__ !== "undefined" ? __DEV__ : process.env.NODE_ENV !== "production";

interface CapturePayload {
  api_key: string;
  event: string;
  distinct_id: string;
  properties: Record<string, unknown>;
  timestamp?: string;
}

/**
 * PostHog transport implemented directly over fetch so the app carries no
 * additional native dependencies. Events are queued and flushed in small
 * batches; failures are swallowed (analytics must never break the app).
 */
class AnalyticsService {
  private queue: CapturePayload[] = [];
  private distinctId: string = "anonymous";
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  private get apiKey(): string | undefined {
    return ENV.EXPO_PUBLIC_POSTHOG_API_KEY;
  }

  private get enabled(): boolean {
    return Boolean(this.apiKey);
  }

  track(event: AnalyticsEvent, properties?: Record<string, any>) {
    const key = this.apiKey;
    if (!key) {
      if (isDev) console.log(`[Analytics: ${event}]`, properties);
      return;
    }

    this.queue.push({
      api_key: key,
      event,
      distinct_id: this.distinctId,
      properties: {
        $lib: "educard-app",
        ...properties,
      },
      timestamp: new Date().toISOString(),
    });

    this.scheduleFlush();
  }

  identify(userId: string, traits?: Record<string, any>) {
    const key = this.apiKey;
    this.distinctId = userId;
    if (key) {
      // `$identify` links the anonymous pre-login id with the account.
      this.queue.push({
        api_key: key,
        event: "$identify",
        distinct_id: userId,
        properties: { $set: traits ?? {} },
      });
      this.scheduleFlush();
    } else if (isDev) {
      console.log(`[Analytics: Identify ${userId}]`, traits);
    }
  }

  reset() {
    this.distinctId = `anonymous-${Date.now().toString(36)}`;
    this.queue = [];
  }

  private scheduleFlush() {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      void this.flush();
    }, 2000);
  }

  async flush(): Promise<void> {
    const key = this.apiKey;
    if (!key || this.queue.length === 0) return;
    const batch = this.queue.splice(0, this.queue.length);

    let response: Response;
    try {
      response = await fetch(`${POSTHOG_HOST}/batch/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: key,
          // Strip the internal retry marker so it is never shipped upstream.
          batch: batch.map((event) => {
            const { __retry, ...properties } = (event as any).properties ?? {};
            void __retry;
            return { ...(event as any), properties };
          }),
        }),
      });
    } catch {
      this.requeue(batch);
      return;
    }

    // A non-2xx means PostHog rejected the batch — previously treated as
    // delivered, silently dropping events on server-side failures.
    if (!response.ok) {
      this.requeue(batch);
      return;
    }

    // Delivered: clear any lingering retry flags on the in-memory objects.
    batch.forEach((p) => delete ((p as any).properties ?? {}).__retry);
  }

  /** Re-queue transient failures once; drop after to bound memory. */
  private requeue(batch: any[]): void {
    if ((batch[0]?.properties as any)?.__retry !== true) {
      batch.forEach((p) => ((p.properties as any).__retry = true));
      this.queue.unshift(...batch);
    }
    if (isDev) console.warn("[Analytics] flush failed");
  }
}

export const Analytics = new AnalyticsService();

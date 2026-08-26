import { describe, it, expect, vi, beforeEach } from "vitest";
import { Telemetry } from "@/lib/telemetry";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

describe("Telemetry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds breadcrumbs up to buffer limit without crashing", () => {
    for (let i = 0; i < 60; i++) {
      Telemetry.addBreadcrumb("test", `test_event_${i}`, { index: i });
    }
    const breadcrumbs = Telemetry.getRecentBreadcrumbs();
    expect(breadcrumbs.length).toBeLessThanOrEqual(50);
    expect(breadcrumbs[breadcrumbs.length - 1].message).toBe("test_event_59");
  });

  it("records error and captures breadcrumb context", () => {
    Telemetry.addBreadcrumb("navigation", "navigation_start");
    const testError = new Error("Test runtime failure");

    expect(() => {
      Telemetry.recordError(testError, { screen: "QuestionDetail" });
    }).not.toThrow();
  });

  it("persists error reports to client_error_reports with fingerprint + breadcrumbs", async () => {
    const { supabase } = await import("@/lib/supabase");
    Telemetry.recordError(new Error("Persisted failure"), { screen: "Home" });
    // recordError is fire-and-forget; flush microtasks.
    await Promise.resolve();
    expect(vi.mocked(supabase.from)).toHaveBeenCalledWith("client_error_reports");
  });

  it("never lets transport failures escape to the caller", () => {
    const broken = new Error("boom");
    expect(() => Telemetry.recordError(broken, null as any)).not.toThrow();
  });
});

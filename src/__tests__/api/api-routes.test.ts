import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as healthHandler } from "@/app/api/health+api";
import { POST as pushHandler, OPTIONS as pushOptionsHandler } from "@/app/api/push+api";

const SERVICE_KEY = "test-service-role-key";
/** Expo tokens are `ExponentPushToken[` + exactly 22 chars + `]`. */
const VALID_TOKEN = "ExponentPushToken[A1b2C3d4E5f6G7h8I9j0K1]";
const MALFORMED_TOKEN = "ExponentPushToken[short"; // missing chars + closing bracket

describe("Expo API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  describe("GET /api/health", () => {
    it("returns 200 with status ok and service metadata", async () => {
      const response = healthHandler();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe("ok");
      expect(data.service).toBe("educard-api");
      expect(data.version).toBe("1.0.0");
      // Never leak secrets through the health probe.
      expect(JSON.stringify(data)).not.toContain("SERVICE_ROLE");
      expect(JSON.stringify(data)).not.toContain("ANON_KEY");
    });
  });

  describe("POST /api/push", () => {
    it("handles OPTIONS request with CORS headers", () => {
      const response = pushOptionsHandler();
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toContain("POST");
    });

    it("FAILS CLOSED (503) when the service key is not configured", async () => {
      vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

      const request = new Request("http://localhost:8081/api/push", {
        method: "POST",
        body: JSON.stringify({ to: VALID_TOKEN, title: "t", message: "m" }),
      });

      const response = await pushHandler(request);
      expect(response.status).toBe(503);
    });

    it("rejects requests with a wrong bearer token (401)", async () => {
      vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", SERVICE_KEY);

      const request = new Request("http://localhost:8081/api/push", {
        method: "POST",
        headers: { Authorization: "Bearer wrong-key" },
        body: JSON.stringify({ to: VALID_TOKEN, title: "t", message: "m" }),
      });

      const response = await pushHandler(request);
      expect(response.status).toBe(401);
    });

    it("rejects malformed JSON bodies with 400 (not 500)", async () => {
      vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", SERVICE_KEY);

      const request = new Request("http://localhost:8081/api/push", {
        method: "POST",
        headers: { Authorization: `Bearer ${SERVICE_KEY}` },
        body: "{not-json",
      });

      const response = await pushHandler(request);
      expect(response.status).toBe(400);
    });

    it("validates missing fields when authenticated", async () => {
      vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", SERVICE_KEY);

      const request = new Request("http://localhost:8081/api/push", {
        method: "POST",
        headers: { Authorization: `Bearer ${SERVICE_KEY}` },
        body: JSON.stringify({ to: VALID_TOKEN }),
      });

      const response = await pushHandler(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Missing required fields");
    });

    it("rejects malformed push tokens (422)", async () => {
      vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", SERVICE_KEY);

      const request = new Request("http://localhost:8081/api/push", {
        method: "POST",
        headers: { Authorization: `Bearer ${SERVICE_KEY}` },
        body: JSON.stringify({ to: "not-a-token", title: "t", message: "m" }),
      });

      const response = await pushHandler(request);
      expect(response.status).toBe(422);
    });

    it("rejects truncated tokens that merely start with the prefix (422)", async () => {
      vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", SERVICE_KEY);

      const request = new Request("http://localhost:8081/api/push", {
        method: "POST",
        headers: { Authorization: `Bearer ${SERVICE_KEY}` },
        body: JSON.stringify({ to: MALFORMED_TOKEN, title: "t", message: "m" }),
      });

      const response = await pushHandler(request);
      expect(response.status).toBe(422);
    });

    it("proxies notification to Expo push service when authorized", async () => {
      vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", SERVICE_KEY);
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ status: "ok", id: "ticket-123" }] }),
      } as any);

      const request = new Request("http://localhost:8081/api/push", {
        method: "POST",
        headers: { Authorization: `Bearer ${SERVICE_KEY}` },
        body: JSON.stringify({
          to: VALID_TOKEN,
          title: "New Answer Received",
          message: "Dr. Scholar answered your inquiry.",
        }),
      });

      const response = await pushHandler(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.result.data[0].status).toBe("ok");
    });

    it("reports failure honestly when the Expo ticket errors (502)", async () => {
      vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", SERVICE_KEY);
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ status: "error", message: "Device not registered" }],
        }),
      } as any);

      const request = new Request("http://localhost:8081/api/push", {
        method: "POST",
        headers: { Authorization: `Bearer ${SERVICE_KEY}` },
        body: JSON.stringify({ to: VALID_TOKEN, title: "t", message: "m" }),
      });

      const response = await pushHandler(request);
      expect(response.status).toBe(502);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });
});

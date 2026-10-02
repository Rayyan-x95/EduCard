import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as pushGet } from "@/app/api/push+api";
import { NotificationsService } from "@/services/notifications";
import { supabase } from "@/lib/supabase";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

vi.mock("@/lib/supabase", () => {
  const deleteMock = vi.fn().mockReturnThis();
  const eqMock = vi.fn().mockReturnThis();
  return {
    supabase: {
      from: vi.fn(() => ({
        delete: deleteMock,
        eq: eqMock,
      })),
    },
  };
});

vi.mock("expo-notifications", () => ({
  getPermissionsAsync: vi.fn(),
  requestPermissionsAsync: vi.fn(),
  getExpoPushTokenAsync: vi.fn(),
  setNotificationChannelAsync: vi.fn(),
  setNotificationHandler: vi.fn(),
  addNotificationResponseReceivedListener: vi.fn(),
}));

vi.mock("expo-device", () => ({
  isDevice: true,
}));

describe("Push Notification Operational Hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  describe("Push Dispatch Health Endpoint (GET /api/push)", () => {
    it("fails closed with 503 when service role key is not configured", async () => {
      const req = new Request("https://educard.ninety5.in/api/push", {
        method: "GET",
      });
      const res = await pushGet(req);
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.configured).toBe(false);
      expect(data.error).toContain("not configured");
    });

    it("returns 401 when Authorization header is invalid", async () => {
      process.env.SUPABASE_SERVICE_ROLE_KEY = "super-secret-key-1234567890";
      const req = new Request("https://educard.ninety5.in/api/push", {
        method: "GET",
        headers: { Authorization: "Bearer wrong-secret" },
      });
      const res = await pushGet(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 200 with operational health status when authenticated", async () => {
      process.env.SUPABASE_SERVICE_ROLE_KEY = "super-secret-key-1234567890";
      const req = new Request("https://educard.ninety5.in/api/push", {
        method: "GET",
        headers: { Authorization: "Bearer super-secret-key-1234567890" },
      });
      const res = await pushGet(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("ok");
      expect(data.configured).toBe(true);
      expect(data.service).toBe("push-api");
      // Must NOT leak the secret itself
      expect(JSON.stringify(data)).not.toContain("super-secret-key-1234567890");
    });
  });

  describe("NotificationsService.unregisterPushToken", () => {
    it("deletes the active device token from push_tokens on logout", async () => {
      const origOs = Platform.OS;
      Platform.OS = "ios";
      vi.mocked(Notifications.getExpoPushTokenAsync).mockResolvedValueOnce({
        data: "ExponentPushToken[abcdefghijklmnopqrstuv]",
        type: "expo",
      } as any);

      await NotificationsService.unregisterPushToken("user-123");

      expect(supabase.from).toHaveBeenCalledWith("push_tokens");
      Platform.OS = origOs;
    });

    it("handles errors gracefully without throwing", async () => {
      vi.mocked(Notifications.getExpoPushTokenAsync).mockRejectedValueOnce(
        new Error("Device error")
      );

      await expect(
        NotificationsService.unregisterPushToken("user-123")
      ).resolves.not.toThrow();
    });
  });
});

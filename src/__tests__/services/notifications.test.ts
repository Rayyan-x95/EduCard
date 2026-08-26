import { describe, it, expect, vi } from "vitest";
import { NotificationsService } from "../../services/notifications";

const mockRpc = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: vi.fn(),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
  },
}));

vi.mock("expo-notifications", () => ({
  setNotificationHandler: vi.fn(),
  getPermissionsAsync: vi.fn().mockResolvedValue({ status: "granted" }),
  requestPermissionsAsync: vi.fn().mockResolvedValue({ status: "granted" }),
  getExpoPushTokenAsync: vi.fn().mockResolvedValue({ data: "ExponentPushToken[xxxxxx]" }),
  setNotificationChannelAsync: vi.fn().mockResolvedValue(undefined),
  addNotificationResponseReceivedListener: vi.fn().mockReturnValue({ remove: vi.fn() }),
  AndroidImportance: { MAX: 5 },
}));

vi.mock("expo-device", () => ({
  isDevice: true,
}));

vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn().mockResolvedValue(null),
  setItemAsync: vi.fn().mockResolvedValue(null),
  deleteItemAsync: vi.fn().mockResolvedValue(null),
}));

describe("NotificationsService", () => {
  it("exposes push notification registration and listener methods", () => {
    expect(typeof NotificationsService.registerForPushNotifications).toBe("function");
    expect(typeof NotificationsService.addNotificationResponseReceivedListener).toBe("function");
    expect(typeof NotificationsService.getNotifications).toBe("function");
    expect(typeof NotificationsService.markAsRead).toBe("function");
  });

  it("fetches the server-computed unread count via RPC", async () => {
    mockRpc.mockResolvedValueOnce({ data: 7, error: null });
    await expect(NotificationsService.getUnreadCount()).resolves.toBe(7);
    expect(mockRpc).toHaveBeenCalledWith("get_unread_notification_count");
  });

  it("coerces a null RPC payload to zero", async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: null });
    await expect(NotificationsService.getUnreadCount()).resolves.toBe(0);
  });

  it("propagates unread-count RPC errors instead of swallowing them", async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: "RLS denied" } });
    await expect(NotificationsService.getUnreadCount()).rejects.toMatchObject({
      message: "RLS denied",
    });
  });
});

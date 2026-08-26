import { describe, it, expect, vi } from "vitest";
import { AppHaptics } from "../../lib/haptics";
import { ShareService } from "../../lib/sharing";
import { InAppBrowser } from "../../lib/browser";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

vi.mock("expo-haptics", () => ({
  impactAsync: vi.fn().mockResolvedValue(undefined),
  notificationAsync: vi.fn().mockResolvedValue(undefined),
  selectionAsync: vi.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: "Light", Medium: "Medium", Heavy: "Heavy" },
  NotificationFeedbackType: { Success: "Success", Warning: "Warning", Error: "Error" },
}));

vi.mock("expo-clipboard", () => ({
  setStringAsync: vi.fn().mockResolvedValue(true),
  getStringAsync: vi.fn().mockResolvedValue("test text"),
}));

vi.mock("expo-web-browser", () => ({
  openBrowserAsync: vi.fn().mockResolvedValue({ type: "opened" }),
}));

vi.mock("expo-network", () => ({
  getNetworkStateAsync: vi.fn().mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
  }),
}));

vi.mock("expo-sharing", () => ({
  isAvailableAsync: vi.fn().mockResolvedValue(false),
  shareAsync: vi.fn().mockResolvedValue(undefined),
}));

describe("Native Expo Features", () => {
  it("executes haptic methods safely", async () => {
    await expect(AppHaptics.light()).resolves.not.toThrow();
    await expect(AppHaptics.medium()).resolves.not.toThrow();
    await expect(AppHaptics.success()).resolves.not.toThrow();
    await expect(AppHaptics.error()).resolves.not.toThrow();
    await expect(AppHaptics.selection()).resolves.not.toThrow();
  });

  it("triggers clipboard copy with string content", async () => {
    await expect(ShareService.copyToClipboard("https://educard.app", "Link")).resolves.not.toThrow();
  });

  it("opens URLs in in-app browser", async () => {
    await expect(InAppBrowser.openUrl("https://educard.app/terms")).resolves.not.toThrow();
  });
});

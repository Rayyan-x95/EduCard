import * as WebBrowser from "expo-web-browser";
import { AppHaptics } from "./haptics";

export const InAppBrowser = {
  /**
   * Open an external URL inside an in-app browser custom tab
   */
  async openUrl(url: string) {
    await AppHaptics.light();
    try {
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: "#0b0f11",
        secondaryToolbarColor: "#171a1c",
        controlsColor: "#bdc2ff",
        enableBarCollapsing: true,
        showTitle: true,
      });
    } catch {
      // Fallback if browser could not open
    }
  },
};

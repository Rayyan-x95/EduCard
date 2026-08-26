import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

export const AppHaptics = {
  /**
   * Light impact for tab changes, chips, and subtle interactions
   */
  async light() {
    if (Platform.OS === "web") return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  },

  /**
   * Medium impact for upvotes, bookmarking, and primary button taps
   */
  async medium() {
    if (Platform.OS === "web") return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  },

  /**
   * Success notification haptic for accepted solutions and onboarding finish
   */
  async success() {
    if (Platform.OS === "web") return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  },

  /**
   * Error notification haptic for failed submissions or validation errors
   */
  async error() {
    if (Platform.OS === "web") return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {}
  },

  /**
   * Selection click for dropdowns and filter chips
   */
  async selection() {
    if (Platform.OS === "web") return;
    try {
      await Haptics.selectionAsync();
    } catch {}
  },
};

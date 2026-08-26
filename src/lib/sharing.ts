import { Share, Platform, Alert } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import { AppHaptics } from "./haptics";

export const ShareService = {
  /**
   * Share content via the native system share sheet
   */
  async shareQuestion(title: string, questionId: string) {
    await AppHaptics.light();
    const url = `https://educard.app/question/${questionId}`;
    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title,
          text: `Check out this academic discussion on EduCard: "${title}"`,
          url,
        });
        return;
      }

      await Share.share({
        title: `EduCard: ${title}`,
        message: `Check out this academic question on EduCard: "${title}"\n\n${url}`,
        url,
      });
    } catch {
      // User cancelled share
    }
  },

  /**
   * Share a community Space via the native system share sheet
   */
  async shareCommunity(name: string, slug: string) {
    await AppHaptics.light();
    const url = `https://educard.app/community/${slug}`;
    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: name,
          text: `Join the "${name}" academic space on EduCard`,
          url,
        });
        return;
      }

      await Share.share({
        title: `EduCard: ${name}`,
        message: `Join the "${name}" academic space on EduCard\n\n${url}`,
        url,
      });
    } catch {
      // User cancelled share
    }
  },

  /**
   * Copy text or link to device clipboard with tactile feedback
   */
  async copyToClipboard(text: string, label: string = "Text") {
    await Clipboard.setStringAsync(text);
    await AppHaptics.success();
    Alert.alert("Copied to Clipboard", `${label} has been copied to your clipboard.`);
  },

  /**
   * Share a local file (used by the GDPR data export). On web this triggers
   * a download via expo-sharing's web implementation.
   */
  async shareFile(fileUri: string, message: string) {
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      // Fallback: copy the message so the user at least gets feedback.
      await Clipboard.setStringAsync(message);
      return;
    }
    await Sharing.shareAsync(fileUri, {
      mimeType: "application/json",
      dialogTitle: "EduCard Data Export",
    });
  },
};

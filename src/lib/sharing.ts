import { Share, Platform, Alert } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import { AppHaptics } from "./haptics";

import { Analytics } from "./analytics";

export const ShareService = {
  /**
   * Share content via the native system share sheet
   */
  async shareQuestion(title: string, questionId: string) {
    await AppHaptics.light();
    Analytics.track("content_shared", { content_type: "question", content_id: questionId });
    const url = `https://educard.ninety5.in/question/${questionId}`;
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
   * Share an academic post / discussion via the native system share sheet
   */
  async sharePost(title: string, postId: string) {
    await AppHaptics.light();
    Analytics.track("content_shared", { content_type: "post", content_id: postId });
    const url = `https://educard.ninety5.in/post/${postId}`;
    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title,
          text: `Check out this academic post on EduCard: "${title}"`,
          url,
        });
        return;
      }

      await Share.share({
        title: `EduCard: ${title}`,
        message: `Check out this academic post on EduCard: "${title}"\n\n${url}`,
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
    const url = `https://educard.ninety5.in/community/${slug}`;
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
   * Share an academic profile via the native system share sheet
   */
  async shareProfile(username: string, displayName?: string) {
    await AppHaptics.light();
    Analytics.track("content_shared", { content_type: "profile" as any, content_id: username });
    const url = `https://educard.ninety5.in/u/${username}`;
    const name = displayName || `@${username}`;
    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: `${name} on EduCard`,
          text: `Check out ${name}'s academic profile on EduCard`,
          url,
        });
        return;
      }

      await Share.share({
        title: `EduCard: ${name}`,
        message: `Check out ${name}'s academic profile on EduCard\n\n${url}`,
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

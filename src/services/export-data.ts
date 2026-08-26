import { Platform } from "react-native";
import { File, Paths } from "expo-file-system";
import { supabase } from "@/lib/supabase";
import { ShareService } from "@/lib/sharing";
import { Telemetry } from "@/lib/telemetry";

/**
 * GDPR data export. Assembles every record the user owns into a single JSON
 * document and hands it to the OS share sheet (save to Files, email, etc.).
 * This runs entirely client-side against RLS-scoped reads, so it can never
 * expose data the user cannot already see.
 */
export const DataExportService = {
  async buildExport(userId: string): Promise<object> {
    const [
      profile,
      questions,
      answers,
      bookmarks,
      reactions,
      follows,
      blocks,
      reports,
      communities,
      education,
      userTopics,
      verificationRequests,
      notifications,
      pushTokens,
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("questions").select("*").eq("author_id", userId),
      supabase.from("answers").select("*").eq("author_id", userId),
      supabase.from("bookmarks").select("*").eq("user_id", userId),
      supabase.from("reactions").select("*").eq("user_id", userId),
      supabase.from("follows").select("*").or(`follower_id.eq.${userId},following_id.eq.${userId}`),
      supabase.from("blocks").select("*").eq("blocker_id", userId),
      supabase.from("reports").select("*").eq("reporter_id", userId),
      supabase.from("communities").select("*").eq("created_by", userId),
      supabase.from("education").select("*").eq("user_id", userId),
      supabase.from("user_topics").select("*").eq("user_id", userId),
      supabase.from("verification_requests").select("*").eq("user_id", userId),
      supabase.from("notifications").select("*").eq("recipient_id", userId).limit(1000),
      supabase.from("push_tokens").select("device_os, created_at").eq("user_id", userId),
    ]);

    const section = (
      r: { data: unknown; error: { message: string } | null },
      name: string
    ) => {
      if (r.error) {
        // Raw PostgREST detail goes to telemetry only; the user sees
        // human copy with the failing section identified.
        Telemetry.recordError(new Error(`${name}: ${r.error.message}`), {
          source: "export-data",
        });
        throw Object.assign(
          new Error(`Couldn't prepare the "${name}" section of your export.`),
          { code: "APP_ERROR" }
        );
      }
      return r.data;
    };

    return {
      exported_at: new Date().toISOString(),
      format_version: 1,
      profile: section(profile, "profile"),
      education: section(education, "education"),
      topics_followed: section(userTopics, "topics"),
      questions: section(questions, "questions"),
      answers: section(answers, "answers"),
      bookmarks: section(bookmarks, "bookmarks"),
      reactions: section(reactions, "reactions"),
      follows: section(follows, "follows"),
      blocks: section(blocks, "blocks"),
      reports_filed: section(reports, "reports"),
      communities_created: section(communities, "communities"),
      verification_requests: section(verificationRequests, "verification"),
      notifications_recent: section(notifications, "notifications"),
      devices: section(pushTokens, "devices"),
    };
  },

  /**
   * Generates the archive and hands it to the platform.
   *
   * Native: writes a JSON file into the documents directory via the modern
   * expo-file-system File/Paths API (SDK 54+) and opens the share sheet.
   * Web: triggers a browser download — no filesystem is involved.
   */
  async exportAndShare(userId: string, handle: string): Promise<string> {
    const data = await this.buildExport(userId);
    const json = JSON.stringify(data, null, 2);
    const fileName = `educard-export-${handle || "account"}-${Date.now()}.json`;

    if (Platform.OS === "web") {
      // Web has no app filesystem — download via an object URL.
      if (typeof document === "undefined") {
        throw Object.assign(
          new Error("Data export is not supported on this platform."),
          { code: "APP_ERROR" }
        );
      }
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      return fileName;
    }

    // Modern class-based filesystem API: create-or-overwrite in the
    // user-visible documents directory, then hand the file to the OS.
    const file = new File(Paths.document, fileName);
    file.create({ intermediates: true, overwrite: true });
    file.write(json);

    await ShareService.shareFile(file.uri, "Your EduCard data export is ready.");
    return file.uri;
  },
};

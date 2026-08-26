import { supabase } from "@/lib/supabase";
import * as ImagePicker from "expo-image-picker";

export interface ImageUploadResult {
  /** Storage path inside the bucket (e.g. `<userId>/123_attachment.jpg`). */
  path: string;
  /** Convenience URL. For avatars this is a stable public URL; for
   * attachments prefer `getSignedAttachmentUrls` since that bucket is private. */
  url: string;
}

const AVATAR_BUCKET = "avatars";
const ATTACHMENT_BUCKET = "attachments";

export const StorageService = {
  async requestMediaLibraryPermission(): Promise<boolean> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === "granted";
  },

  async pickImage(options?: {
    aspect?: [number, number];
    allowsEditing?: boolean;
    quality?: number;
  }): Promise<string | null> {
    const hasPermission = await this.requestMediaLibraryPermission();
    if (!hasPermission) {
      throw Object.assign(new Error("Photo library permission is required to select images."), {
        code: "APP_PERMISSION_DENIED",
      });
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options?.allowsEditing ?? true,
      aspect: options?.aspect ?? [1, 1],
      quality: options?.quality ?? 0.8,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    return result.assets[0].uri;
  },

  /**
   * Upload an avatar. Avatars live in the public bucket; the returned URL is
   * stored in profiles.avatar_path and rendered directly.
   */
  async uploadAvatar(userId: string, imageUri: string): Promise<ImageUploadResult> {
    const fileExt = imageUri.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `${userId}/avatar_${Date.now()}.${fileExt}`;

    const response = await fetch(imageUri);
    const blob = await response.blob();

    const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
    if ((blob as any).size > AVATAR_MAX_BYTES) {
      throw Object.assign(new Error("Avatar image is too large (max 5 MB)."), { code: "APP_ERROR" });
    }

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, blob, {
        contentType: blob.type || `image/${fileExt}`,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Cleanup runs AFTER the new upload is confirmed — deleting first meant
    // a failed upload left the user with no avatar at all. Old files are
    // removed only once the replacement is safely in place.
    try {
      const { data: existingFiles } = await supabase.storage
        .from(AVATAR_BUCKET)
        .list(userId);

      if (existingFiles && existingFiles.length > 0) {
        const filesToRemove = existingFiles
          .filter((f) => f.name.startsWith("avatar_") && `${userId}/${f.name}` !== filePath)
          .map((f) => `${userId}/${f.name}`);
        if (filesToRemove.length > 0) {
          await supabase.storage.from(AVATAR_BUCKET).remove(filesToRemove);
        }
      }
    } catch {
      // Non-blocking cleanup
    }

    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);

    return {
      path: filePath,
      url: data.publicUrl,
    };
  },

  /**
   * Upload an attachment image for a question or post. Returns the storage
   * PATH only — attachments are in a private bucket, so short-lived signed
   * URLs are minted at render time (see getSignedAttachmentUrls).
   */
  async uploadAttachment(userId: string, imageUri: string): Promise<ImageUploadResult> {
    const fileExt = imageUri.split(".").pop()?.toLowerCase() || "jpg";
    const allowed = ["jpg", "jpeg", "png", "webp", "gif"];
    if (!allowed.includes(fileExt)) {
      throw Object.assign(new Error("Only JPG, PNG, WebP, or GIF images are supported."), {
        code: "APP_INVALID_FILE_TYPE",
      });
    }

    const filePath = `${userId}/${Date.now()}_attachment.${fileExt}`;

    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Client-side size guard before burning network / storage quota (FINDING-027)
    const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
    const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
    const limit = filePath.includes("_attachment") ? ATTACHMENT_MAX_BYTES : AVATAR_MAX_BYTES;
    if ((blob as any).size > limit) {
      const mb = Math.round(limit / (1024 * 1024));
      throw Object.assign(new Error(`Image is too large (max ${mb} MB). Please choose a smaller image.`), {
        code: "APP_ERROR",
      });
    }

    const { error: uploadError } = await supabase.storage
      .from(ATTACHMENT_BUCKET)
      .upload(filePath, blob, {
        contentType: blob.type || `image/${fileExt}`,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    return { path: filePath, url: "" };
  },

  /**
   * Mint short-lived read URLs for attachment paths (private bucket).
   * Uses the batch createSignedUrls API — a single round-trip regardless of
   * gallery size instead of one request per image.
   */
  async getSignedAttachmentUrls(paths: string[], expiresIn = 3600): Promise<string[]> {
    if (!paths || paths.length === 0) return [];
    const { data, error } = await supabase.storage
      .from(ATTACHMENT_BUCKET)
      .createSignedUrls(paths, expiresIn);
    if (error || !data) return [];
    return data
      .filter((entry) => !entry.error && entry.signedUrl)
      .map((entry) => entry.signedUrl as string);
  },

  /**
   * Upload a verification evidence document into the private `verification`
   * bucket. Read access is restricted to the uploader and staff reviewers
   * via storage RLS — never use the public attachments/avatars buckets for
   * PII documents.
   */
  async uploadVerificationEvidence(
    userId: string,
    fileUri: string
  ): Promise<{ path: string }> {
    const ext = fileUri.split(".").pop()?.toLowerCase() || "";
    const allowed = ["jpg", "jpeg", "png", "webp", "pdf"];
    if (!allowed.includes(ext)) {
      throw Object.assign(
        new Error("Evidence must be a JPG, PNG, WebP image or PDF."),
        { code: "APP_INVALID_FILE_TYPE" }
      );
    }

    const filePath = `${userId}/${Date.now()}_evidence.${ext}`;

    const response = await fetch(fileUri);
    const blob = await response.blob();

    const EVIDENCE_MAX_BYTES = 10 * 1024 * 1024;
    if ((blob as any).size > EVIDENCE_MAX_BYTES) {
      throw Object.assign(new Error("Document is too large (max 10 MB)."), {
        code: "APP_ERROR",
      });
    }

    const { error } = await supabase.storage.from("verification").upload(filePath, blob, {
      contentType: blob.type || `application/${ext}`,
      upsert: false,
    });
    if (error) throw error;

    return { path: filePath };
  },

  /** Signed read URL so moderators can inspect an evidence document. */
  async getVerificationEvidenceUrl(path: string, expiresIn = 1800): Promise<string | null> {
    const { data, error } = await supabase.storage
      .from("verification")
      .createSignedUrl(path, expiresIn);
    return error ? null : data?.signedUrl ?? null;
  },
};

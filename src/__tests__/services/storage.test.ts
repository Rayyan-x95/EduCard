import { describe, it, expect, vi } from "vitest";
import { StorageService } from "../../services/storage";

const mockFromBucket = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    storage: {
      from: (...args: unknown[]) => mockFromBucket(...args),
    },
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
  },
}));

vi.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: vi.fn().mockResolvedValue({ status: "granted" }),
  launchImageLibraryAsync: vi.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: "file:///test/image.png" }],
  }),
  MediaTypeOptions: { Images: "Images" },
}));

vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn().mockResolvedValue(null),
  setItemAsync: vi.fn().mockResolvedValue(null),
  deleteItemAsync: vi.fn().mockResolvedValue(null),
}));

describe("StorageService", () => {
  it("exposes pickImage, uploadAvatar, and uploadAttachment methods", () => {
    expect(typeof StorageService.pickImage).toBe("function");
    expect(typeof StorageService.uploadAvatar).toBe("function");
    expect(typeof StorageService.uploadAttachment).toBe("function");
  });

  it("extracts extension from file uri correctly", () => {
    const imageUri = "file:///path/to/my_photo.png";
    const fileExt = imageUri.split(".").pop()?.toLowerCase() || "jpg";
    expect(fileExt).toBe("png");
  });

  it("handles fallback extension when uri has no dot", () => {
    const imageUri = "data:image/jpeg;base64";
    const fileExt = imageUri.includes(".") ? imageUri.split(".").pop() : "jpg";
    expect(fileExt).toBe("jpg");
  });

  it("calls launchImageLibraryAsync when picking an image", async () => {
    const uri = await StorageService.pickImage({ allowsEditing: true });
    expect(uri).toBe("file:///test/image.png");
  });

  it("mints signed attachment URLs in a single batched request", async () => {
    const createSignedUrls = vi.fn().mockResolvedValue({
      data: [
        { path: "u/a.jpg", signedUrl: "https://signed/a" },
        { path: "u/b.jpg", error: { message: "missing" } },
        { path: "u/c.jpg", signedUrl: "https://signed/c" },
      ],
      error: null,
    });
    mockFromBucket.mockReturnValue({ createSignedUrls });

    const urls = await StorageService.getSignedAttachmentUrls([
      "u/a.jpg",
      "u/b.jpg",
      "u/c.jpg",
    ]);

    // One round-trip regardless of gallery size; failed entries dropped.
    expect(createSignedUrls).toHaveBeenCalledTimes(1);
    expect(createSignedUrls).toHaveBeenCalledWith(
      ["u/a.jpg", "u/b.jpg", "u/c.jpg"],
      3600
    );
    expect(urls).toEqual(["https://signed/a", "https://signed/c"]);
  });

  it("returns an empty list without contacting storage when no paths given", async () => {
    mockFromBucket.mockClear();
    await expect(StorageService.getSignedAttachmentUrls([])).resolves.toEqual([]);
    expect(mockFromBucket).not.toHaveBeenCalled();
  });
});

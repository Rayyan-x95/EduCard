import { describe, it, expect, vi, beforeEach } from "vitest";
import { DataExportService } from "@/services/export-data";

/**
 * Regression tests for the GDPR export. The section helper previously
 * surfaced raw PostgREST error messages (`${name}: ${error.message}`) to
 * users; it must throw human copy tagged APP_ERROR while keeping provider
 * detail out of the user-facing message.
 */

const mockFrom = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
  },
}));

vi.mock("expo-file-system", () => {
  const createdFiles: { name: string; contents: string }[] = [];
  class File {
    static created = createdFiles;
    uri: string;
    name: string;
    constructor(_dir: unknown, name: string) {
      this.name = name;
      this.uri = `file:///documents/${name}`;
      File.created.push({ name, contents: "" });
    }
    create() {}
    write(contents: string) {
      const entry = File.created.find((f) => f.name === this.name);
      if (entry) entry.contents = contents;
    }
  }
  return { File, Paths: { document: "/documents" } };
});

vi.mock("@/lib/sharing", () => ({
  ShareService: { shareFile: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock("react-native", () => ({ Platform: { OS: "ios" } }));

function makeProxy(result: { data: unknown; error: unknown }) {
  let self: any;
  self = new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === "then") {
          return (resolve: any, reject: any) =>
            Promise.resolve(result).then(resolve, reject);
        }
        return vi.fn().mockReturnValue(self);
      },
    }
  );
  return self;
}

describe("DataExportService.buildExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReset();
  });

  it("assembles every owned-data section on success", async () => {
    mockFrom.mockImplementation(() => makeProxy({ data: [], error: null }));

    const result = (await DataExportService.buildExport("user-1")) as Record<string, unknown>;

    for (const key of [
      "exported_at",
      "format_version",
      "profile",
      "education",
      "topics_followed",
      "questions",
      "answers",
      "bookmarks",
      "reactions",
      "follows",
      "blocks",
      "reports_filed",
      "communities_created",
      "verification_requests",
      "notifications_recent",
      "devices",
    ]) {
      expect(result).toHaveProperty(key);
    }
  });

  it("throws human APP_ERROR copy without leaking raw provider messages", async () => {
    mockFrom.mockImplementation((table: string) =>
      table === "questions"
        ? makeProxy({ data: null, error: { message: "permission denied for table questions" } })
        : makeProxy({ data: [], error: null })
    );

    await expect(DataExportService.buildExport("user-1")).rejects.toMatchObject({
      code: "APP_ERROR",
    });

    // The rejection must be asserted before inspecting its message content.
    try {
      await DataExportService.buildExport("user-1");
    } catch (err) {
      const message = (err as Error).message;
      expect(message).toContain("questions");
      expect(message).not.toContain("permission denied");
    }
  });

  it("writes the export via the modern File API and shares it (native)", async () => {
    mockFrom.mockImplementation(() => makeProxy({ data: [], error: null }));

    const fileUri = await DataExportService.exportAndShare("user-1", "sarah");

    // The mocked File records what was written; verify the JSON payload.
    const { ShareService } = await import("@/lib/sharing");
    const { File } = (await import("expo-file-system")) as any;
    const written = File.created.find((f: any) => f.name.includes("sarah"));
    expect(written).toBeTruthy();
    expect(JSON.parse(written.contents).format_version).toBe(1);
    expect(ShareService.shareFile).toHaveBeenCalledWith(
      fileUri,
      "Your EduCard data export is ready."
    );
  });
});

import { describe, it, expect } from "vitest";
import { CSP_DIRECTIVES, buildCspHeader } from "@/lib/csp";

describe("Content Security Policy (lib/csp)", () => {
  it("builds a valid semicolon-separated CSP header string", () => {
    const header = buildCspHeader();
    expect(header).toBeTypeOf("string");
    expect(header.length).toBeGreaterThan(50);
    expect(header).toContain("default-src 'self'");
    expect(header).toContain("object-src 'none'");
    expect(header).toContain("base-uri 'self'");
  });

  it("permits only verified upstream endpoints in connect-src", () => {
    const connectSrc = CSP_DIRECTIVES["connect-src"];
    expect(connectSrc).toContain("'self'");
    expect(connectSrc).toContain("https://*.supabase.co");
    expect(connectSrc).toContain("wss://*.supabase.co");
    expect(connectSrc).toContain("https://exp.host");
    expect(connectSrc).toContain("https://us.i.posthog.com");
    expect(connectSrc).toContain("https://*.sentry.io");

    // Negative check: must NOT have wildcards or arbitrary external hosts
    expect(connectSrc).not.toContain("*");
    expect(connectSrc).not.toContain("http://*");
    expect(connectSrc).not.toContain("https://*");
  });

  it("restricts object-src completely to prevent plugin exploits", () => {
    expect(CSP_DIRECTIVES["object-src"]).toEqual(["'none'"]);
  });

  it("allows safe image loading including avatars and blobs", () => {
    const imgSrc = CSP_DIRECTIVES["img-src"];
    expect(imgSrc).toContain("'self'");
    expect(imgSrc).toContain("data:");
    expect(imgSrc).toContain("blob:");
    expect(imgSrc).toContain("https:");
  });
});

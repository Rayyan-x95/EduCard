import { describe, it, expect } from "vitest";
import { DataClassification } from "@/lib/data-classification";

describe("DataClassification", () => {
  it("classifies questions and answers correctly as public tier", () => {
    const questionPolicy = DataClassification.getPolicy("question.title");
    expect(questionPolicy.tier).toBe("PUBLIC");
    expect(questionPolicy.allowInTelemetry).toBe(true);
    expect(questionPolicy.exportable).toBe(true);

    const answerPolicy = DataClassification.getPolicy("answer.content");
    expect(answerPolicy.tier).toBe("PUBLIC");
    expect(answerPolicy.allowInTelemetry).toBe(false);
  });

  it("classifies student email and push token as sensitive tier", () => {
    const emailPolicy = DataClassification.getPolicy("user.email");
    expect(emailPolicy.tier).toBe("SENSITIVE");
    expect(emailPolicy.allowInTelemetry).toBe(false);
    expect(emailPolicy.exportable).toBe(true);

    const pushPolicy = DataClassification.getPolicy("push.token");
    expect(pushPolicy.tier).toBe("SENSITIVE");
    expect(pushPolicy.exportable).toBe(false);
  });

  it("defaults unclassified fields to RESTRICTED least privilege", () => {
    const unknownPolicy = DataClassification.getPolicy("mystery.field");
    expect(unknownPolicy.tier).toBe("RESTRICTED");
    expect(unknownPolicy.allowInTelemetry).toBe(false);
    expect(unknownPolicy.exportable).toBe(false);
  });

  it("redacts sensitive and private fields when sanitizing for logging", () => {
    const rawPayload = {
      "question.title": "How does Dijkstra's algorithm work?",
      "analytics.event_name": "question_viewed",
      "user.email": "student@mit.edu",
      "profile.full_name": "Ada Lovelace",
    };

    const sanitized = DataClassification.sanitizeForLogging(rawPayload);
    expect(sanitized["question.title"]).toBe("How does Dijkstra's algorithm work?");
    expect(sanitized["analytics.event_name"]).toBe("question_viewed");
    expect(sanitized["user.email"]).toBe("[REDACTED]");
    expect(sanitized["profile.full_name"]).toBe("[REDACTED]");
  });
});

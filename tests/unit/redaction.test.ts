import { describe, expect, it } from "vitest";
import { redactSensitive } from "@/lib/redaction";

describe("redaction", () => {
  it("redacts names and phone numbers", () => {
    const result = redactSensitive("John Smith called 0412 345 678 about the address 10 King Street.");
    expect(result.redactedText).toContain("[PERSON]");
    expect(result.redactedText).toContain("[PHONE]");
    expect(result.redactedText).toContain("[ADDRESS]");
  });
});

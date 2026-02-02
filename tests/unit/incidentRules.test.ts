import { describe, expect, it } from "vitest";
import { calculateDueDates, validateIncident } from "@/lib/incidentRules";

describe("incident rules", () => {
  it("validates required fields", () => {
    const errors = validateIncident({
      category: "",
      severity: "High",
      description: "Short",
      immediateActions: ""
    });
    expect(errors.length).toBeGreaterThan(0);
  });

  it("calculates due dates", () => {
    const dates = calculateDueDates("high", new Date("2024-01-01T00:00:00Z"));
    expect(dates.followUp).toBe("2024-01-02T00:00:00.000Z");
  });
});

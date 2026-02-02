import { describe, expect, it } from "vitest";
import { suggestAssignments } from "@/lib/rosterRules";

describe("roster rules", () => {
  it("flags fatigue risk", () => {
    const shifts = [
      {
        id: "shift-1",
        start: new Date("2024-01-02T08:00:00Z"),
        end: new Date("2024-01-02T16:00:00Z")
      }
    ] as any;

    const staff = [
      {
        userId: "user-1",
        skills: [],
        assignedShifts: [
          {
            id: "shift-0",
            start: new Date("2024-01-02T00:00:00Z"),
            end: new Date("2024-01-02T06:00:00Z")
          }
        ],
        maxHoursPerWeek: 40,
        minRestHours: 10
      }
    ];

    const suggestions = suggestAssignments(shifts, staff as any);
    expect(suggestions[0].riskFlags).toContain("Fatigue risk (< minimum rest)");
  });
});

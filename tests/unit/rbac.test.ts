import { describe, expect, it } from "vitest";
import { hasMinRole, hasRequiredRole } from "@/lib/rbac";

describe("rbac", () => {
  it("checks required roles", () => {
    expect(hasRequiredRole("ADMIN", ["ADMIN", "QUALITY_SAFETY"])).toBe(true);
    expect(hasRequiredRole("STAFF", ["ADMIN"])).toBe(false);
  });

  it("checks minimum role", () => {
    expect(hasMinRole("ADMIN", "MANAGEMENT")).toBe(true);
    expect(hasMinRole("STAFF", "TEAM_LEADER")).toBe(false);
  });
});

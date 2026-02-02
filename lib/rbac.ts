import type { Role } from "@prisma/client";

export const roleHierarchy: Record<Role, number> = {
  STAFF: 1,
  TEAM_LEADER: 2,
  QUALITY_SAFETY: 3,
  FINANCE: 3,
  MANAGEMENT: 4,
  ADMIN: 5
};

export function hasRequiredRole(userRole: Role, required: Role[]) {
  return required.includes(userRole);
}

export function hasMinRole(userRole: Role, minimum: Role) {
  return roleHierarchy[userRole] >= roleHierarchy[minimum];
}

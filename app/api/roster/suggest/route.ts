import { NextResponse } from "next/server";
import { assertRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { suggestAssignments } from "@/lib/rosterRules";
import { logAuditEvent } from "@/lib/audit";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await assertRole(["TEAM_LEADER", "ADMIN"]);
    const shifts = await prisma.shift.findMany({ where: { status: "OPEN" } });
    const users = await prisma.user.findMany({ where: { status: "ACTIVE" } });
    const settings = await prisma.systemSetting.findMany({
      where: { category: "ROSTER" }
    });
    const maxHoursSetting = settings.find((setting) => setting.key === "maxHoursPerWeek");
    const minRestSetting = settings.find((setting) => setting.key === "minRestHours");
    const maxHoursPerWeek = Number((maxHoursSetting?.valueJson as any)?.hours ?? 40);
    const minRestHours = Number((minRestSetting?.valueJson as any)?.hours ?? 10);

    const staffAvailability = await Promise.all(
      users.map(async (staff) => {
        const assignedShifts = await prisma.shift.findMany({
          where: { assignedUserId: staff.id }
        });
        return {
          userId: staff.id,
          skills: [],
          assignedShifts,
          maxHoursPerWeek,
          minRestHours
        };
      })
    );

    const suggestions = suggestAssignments(shifts, staffAvailability);

    await logAuditEvent({
      actorUserId: user.id,
      action: "roster.suggest",
      entityType: "Roster",
      entityId: "suggestions",
      metadata: { suggestionCount: suggestions.length },
      ip: req.headers.get("x-forwarded-for")
    });

    return NextResponse.json({ suggestions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    if (message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (message === "CSRF_BLOCKED") {
      return NextResponse.json({ error: "CSRF blocked" }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

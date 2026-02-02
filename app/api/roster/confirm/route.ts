import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { assertSameOrigin } from "@/lib/csrf";

const schema = z.object({
  shiftId: z.string(),
  userId: z.string()
});

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await assertRole(["TEAM_LEADER", "ADMIN"]);
    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const shift = await prisma.shift.update({
      where: { id: result.data.shiftId },
      data: {
        assignedUserId: result.data.userId,
        status: "ASSIGNED"
      }
    });

    await logAuditEvent({
      actorUserId: user.id,
      action: "roster.confirm",
      entityType: "Shift",
      entityId: shift.id,
      metadata: { assignedUserId: result.data.userId },
      ip: req.headers.get("x-forwarded-for")
    });

    return NextResponse.json({ shift });
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

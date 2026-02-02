import { NextResponse } from "next/server";
import { assertRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    assertSameOrigin(req);
    const user = await assertRole(["QUALITY_SAFETY", "ADMIN"]);
    const incident = await prisma.incident.update({
      where: { id: params.id },
      data: { status: "CLOSED" }
    });

    await prisma.approvalRequest.create({
      data: {
        entityType: "Incident",
        entityId: incident.id,
        requestedBy: user.id,
        requiredRole: "QUALITY_SAFETY",
        status: "APPROVED",
        decidedBy: user.id,
        decidedAt: new Date(),
        comment: "Closed by Quality & Safety"
      }
    });

    await logAuditEvent({
      actorUserId: user.id,
      action: "incident.close",
      entityType: "Incident",
      entityId: incident.id,
      metadata: { status: "CLOSED" },
      ip: req.headers.get("x-forwarded-for")
    });

    return NextResponse.json({ incident });
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

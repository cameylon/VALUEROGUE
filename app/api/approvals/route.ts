import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { assertSameOrigin } from "@/lib/csrf";

const schema = z.object({
  approvalId: z.string(),
  decision: z.enum(["APPROVED", "REJECTED"]),
  comment: z.string().optional()
});

export async function GET() {
  try {
    await assertRole(["QUALITY_SAFETY", "ADMIN", "MANAGEMENT"]);
    const approvals = await prisma.approvalRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: { requester: true }
    });
    return NextResponse.json({ approvals });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    if (message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await assertRole(["QUALITY_SAFETY", "ADMIN"]);
    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const approval = await prisma.approvalRequest.update({
      where: { id: result.data.approvalId },
      data: {
        status: result.data.decision,
        decidedBy: user.id,
        decidedAt: new Date(),
        comment: result.data.comment
      }
    });

    await logAuditEvent({
      actorUserId: user.id,
      action: "approval.decision",
      entityType: "ApprovalRequest",
      entityId: approval.id,
      metadata: { decision: approval.status },
      ip: req.headers.get("x-forwarded-for")
    });

    return NextResponse.json({ approval });
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

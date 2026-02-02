import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { assertSameOrigin } from "@/lib/csrf";

const schema = z.object({
  clientId: z.string(),
  shiftId: z.string().optional(),
  noteText: z.string().min(3),
  structuredJson: z.record(z.unknown()),
  status: z.enum(["DRAFT", "SUBMITTED"])
});

const INCIDENT_KEYWORDS = ["incident", "injury", "fall", "aggression", "restraint", "emergency"];
const EMERGENCY_KEYWORDS = ["self-harm", "suicide", "overdose", "unresponsive", "000"];

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await assertRole(["STAFF", "TEAM_LEADER", "ADMIN", "MANAGEMENT"]);
    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const requiresApproval =
      result.data.status === "SUBMITTED" &&
      INCIDENT_KEYWORDS.some((keyword) => result.data.noteText.toLowerCase().includes(keyword));

    const emergencyDetected =
      result.data.status === "SUBMITTED" &&
      EMERGENCY_KEYWORDS.some((keyword) => result.data.noteText.toLowerCase().includes(keyword));

    if (emergencyDetected) {
      return NextResponse.json({ error: "Escalation required before submission." }, { status: 400 });
    }

    const careNote = await prisma.careNote.create({
      data: {
        clientId: result.data.clientId,
        shiftId: result.data.shiftId,
        authorUserId: user.id,
        noteText: result.data.noteText,
        structuredJson: result.data.structuredJson,
        status: result.data.status,
        submittedAt: result.data.status === "SUBMITTED" ? new Date() : null
      }
    });

    if (requiresApproval) {
      await prisma.approvalRequest.create({
        data: {
          entityType: "CareNote",
          entityId: careNote.id,
          requestedBy: user.id,
          requiredRole: "QUALITY_SAFETY",
          status: "PENDING"
        }
      });
    }

    await logAuditEvent({
      actorUserId: user.id,
      action: "careNote.create",
      entityType: "CareNote",
      entityId: careNote.id,
      metadata: { status: careNote.status, requiresApproval },
      ip: req.headers.get("x-forwarded-for")
    });

    return NextResponse.json({ careNote, requiresApproval });
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

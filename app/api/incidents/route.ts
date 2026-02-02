import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateDueDates, validateIncident } from "@/lib/incidentRules";
import { logAuditEvent } from "@/lib/audit";
import { assertSameOrigin } from "@/lib/csrf";

const schema = z.object({
  clientId: z.string(),
  homeId: z.string(),
  category: z.string(),
  severity: z.string(),
  description: z.string(),
  immediateActions: z.string()
});

export async function GET() {
  try {
    await assertRole(["STAFF", "TEAM_LEADER", "QUALITY_SAFETY", "ADMIN", "MANAGEMENT"]);
    const incidents = await prisma.incident.findMany({
      orderBy: { createdAt: "desc" },
      include: { client: true, home: true }
    });
    return NextResponse.json({ incidents });
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
    const user = await assertRole(["STAFF", "TEAM_LEADER", "QUALITY_SAFETY", "ADMIN"]);
    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const errors = validateIncident(result.data);
    if (errors.length) {
      return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
    }

    const settings = await prisma.systemSetting.findMany({ where: { category: "COMPLIANCE" } });
    const highSeveritySetting = settings.find((setting) => setting.key === "highSeverityFollowupHours");
    const highSeverityHours = Number((highSeveritySetting?.valueJson as any)?.hours ?? 24);
    const dueDates = calculateDueDates(result.data.severity, new Date(), highSeverityHours, 72);

    const incident = await prisma.incident.create({
      data: {
        clientId: result.data.clientId,
        homeId: result.data.homeId,
        reporterUserId: user.id,
        category: result.data.category,
        severity: result.data.severity,
        description: result.data.description,
        immediateActions: result.data.immediateActions,
        dueDatesJson: dueDates,
        status: "DRAFT"
      }
    });

    await logAuditEvent({
      actorUserId: user.id,
      action: "incident.create",
      entityType: "Incident",
      entityId: incident.id,
      metadata: { severity: incident.severity },
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

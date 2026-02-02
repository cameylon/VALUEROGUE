import { NextResponse } from "next/server";
import { assertRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    await assertRole(["ADMIN", "QUALITY_SAFETY", "MANAGEMENT"]);
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const events = await prisma.auditEvent.findMany({
      where: {
        createdAt: {
          gte: start ? new Date(start) : undefined,
          lte: end ? new Date(end) : undefined
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const headers = ["id", "actorUserId", "action", "entityType", "entityId", "createdAt"];
    const rows = events.map((event) => [
      event.id,
      event.actorUserId,
      event.action,
      event.entityType,
      event.entityId,
      event.createdAt.toISOString()
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=lds-nexus-audit.csv"
      }
    });
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

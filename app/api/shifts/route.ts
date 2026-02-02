import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/auth";

export async function GET() {
  try {
    await assertRole(["STAFF", "TEAM_LEADER", "QUALITY_SAFETY", "ADMIN", "MANAGEMENT"]);
    const shifts = await prisma.shift.findMany({
      orderBy: { start: "asc" },
      include: { home: true, client: true }
    });
    return NextResponse.json({ shifts });
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

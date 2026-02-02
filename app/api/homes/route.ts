import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/auth";

export async function GET() {
  try {
    await assertRole(["STAFF", "TEAM_LEADER", "QUALITY_SAFETY", "ADMIN", "MANAGEMENT"]);
    const homes = await prisma.home.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ homes });
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

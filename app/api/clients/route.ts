import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/csrf";

const schema = z.object({
  preferredName: z.string(),
  legalName: z.string().optional(),
  dob: z.string().optional(),
  notes: z.string().optional()
});

export async function GET() {
  try {
    await assertRole(["STAFF", "TEAM_LEADER", "QUALITY_SAFETY", "ADMIN", "MANAGEMENT"]);
    const clients = await prisma.client.findMany({ orderBy: { preferredName: "asc" } });
    return NextResponse.json({ clients });
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
    await assertRole(["STAFF", "TEAM_LEADER", "ADMIN"]);
    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const client = await prisma.client.create({
      data: {
        preferredName: result.data.preferredName,
        legalName: result.data.legalName,
        dob: result.data.dob ? new Date(result.data.dob) : undefined,
        notes: result.data.notes
      }
    });

    return NextResponse.json({ client });
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

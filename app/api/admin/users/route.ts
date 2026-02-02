import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/csrf";

const schema = z.object({
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["STAFF", "TEAM_LEADER", "QUALITY_SAFETY", "FINANCE", "ADMIN", "MANAGEMENT"])
});

export async function GET() {
  try {
    await assertRole(["ADMIN"]);
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true }
    });
    return NextResponse.json({ users });
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
    await assertRole(["ADMIN"]);
    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const tempPassword = "Password123!";
    const passwordHash = await hashPassword(tempPassword);

    const user = await prisma.user.create({
      data: {
        name: result.data.name,
        email: result.data.email,
        role: result.data.role,
        passwordHash,
        status: "ACTIVE"
      }
    });

    return NextResponse.json({ user, tempPassword });
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

import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/csrf";

const schema = z.object({
  category: z.enum(["AI", "COMPLIANCE", "ROSTER", "REDACTION"]),
  key: z.string(),
  valueJson: z.record(z.unknown())
});

export async function GET() {
  try {
    await assertRole(["ADMIN"]);
    const settings = await prisma.systemSetting.findMany();
    return NextResponse.json({
      settings,
      aiConfigured: Boolean(process.env.OPENAI_API_KEY)
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

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    await assertRole(["ADMIN"]);
    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const setting = await prisma.systemSetting.upsert({
      where: {
        id: `${result.data.category}-${result.data.key}`
      },
      update: {
        valueJson: result.data.valueJson
      },
      create: {
        id: `${result.data.category}-${result.data.key}`,
        category: result.data.category,
        key: result.data.key,
        valueJson: result.data.valueJson
      }
    });

    return NextResponse.json({ setting });
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

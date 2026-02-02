import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticate, signToken, setAuthCookie } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { logAuditEvent } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rateLimit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const ip = req.headers.get("x-forwarded-for") ?? "local";
    const rate = checkRateLimit(ip, 10, 60_000);
    if (!rate.allowed) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }
    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }

    const user = await authenticate(result.data.email, result.data.password);
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = signToken(user);
    setAuthCookie(token);
    await logAuditEvent({
      actorUserId: user.id,
      action: "auth.login",
      entityType: "User",
      entityId: user.id,
      metadata: { email: user.email },
      ip: req.headers.get("x-forwarded-for")
    });

    return NextResponse.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "CSRF_BLOCKED") {
      return NextResponse.json({ error: "CSRF blocked" }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

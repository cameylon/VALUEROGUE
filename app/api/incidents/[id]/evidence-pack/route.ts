import { NextResponse } from "next/server";
import { assertRole } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { evidenceQueue } from "@/lib/queue";
import { generateEvidencePackForIncident } from "@/lib/evidencePack";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    assertSameOrigin(req);
    const user = await assertRole(["QUALITY_SAFETY", "ADMIN"]);
    const inlineJobs = process.env.INLINE_JOBS !== "false";
    if (inlineJobs) {
      const evidencePack = await generateEvidencePackForIncident({
        incidentId: params.id,
        userId: user.id,
        ip: req.headers.get("x-forwarded-for")
      });
      return NextResponse.json({ evidencePack });
    }

    const job = await evidenceQueue.add("generate-evidence-pack", {
      incidentId: params.id,
      userId: user.id,
      ip: req.headers.get("x-forwarded-for")
    });

    return NextResponse.json({ jobId: job.id });
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

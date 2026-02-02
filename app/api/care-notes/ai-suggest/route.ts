import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole } from "@/lib/auth";
import { runCareNoteAgent } from "@/lib/agentRunner";
import { logAuditEvent } from "@/lib/audit";
import { assertSameOrigin } from "@/lib/csrf";

const schema = z.object({
  text: z.string().min(3),
  clientLabel: z.string(),
  staffLabel: z.string()
});

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await assertRole(["STAFF", "TEAM_LEADER", "ADMIN", "MANAGEMENT"]);
    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const agentResult = await runCareNoteAgent({
      text: result.data.text,
      tool: "CARE_NOTE_COPILOT",
      clientLabel: result.data.clientLabel,
      staffLabel: result.data.staffLabel
    });

    await logAuditEvent({
      actorUserId: user.id,
      action: "careNote.aiSuggest",
      entityType: "CareNote",
      entityId: agentResult.runId,
      metadata: {
        tool: "CARE_NOTE_COPILOT",
        redactionSummary: agentResult.redactionSummary,
        outputChecksum: agentResult.outputChecksum
      },
      ip: req.headers.get("x-forwarded-for")
    });

    return NextResponse.json({
      runId: agentResult.runId,
      output: agentResult.output,
      model: agentResult.modelName,
      missingFields: agentResult.output.missingFields
    });
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

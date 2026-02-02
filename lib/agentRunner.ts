import crypto from "crypto";
import { prisma } from "./prisma";
import { getAiProvider } from "./aiProvider";
import { redactSensitive } from "./redaction";
import type { AgentTool } from "@prisma/client";

export type AgentRunInput = {
  text: string;
  tool: AgentTool;
  clientLabel: string;
  staffLabel: string;
};

export async function runCareNoteAgent(input: AgentRunInput) {
  const runId = crypto.randomUUID();
  if (!input.text.trim()) {
    throw new Error("Validation failed: empty input");
  }

  const redaction = redactSensitive(input.text);
  const promptHash = crypto.createHash("sha256").update(redaction.redactedText).digest("hex");
  const provider = getAiProvider();
  const aiResult = await provider.generateCareNote({
    text: redaction.redactedText,
    clientLabel: input.clientLabel,
    staffLabel: input.staffLabel
  });

  const checksum = crypto
    .createHash("sha256")
    .update(JSON.stringify(aiResult.output))
    .digest("hex");

  await prisma.agentRun.create({
    data: {
      runId,
      tool: input.tool,
      modelName: aiResult.modelName,
      tokenEstimate: aiResult.tokenEstimate,
      redactionSummary: aiResult.redactionSummary,
      promptHash,
      outputChecksum: checksum
    }
  });

  return {
    runId,
    redactionSummary: aiResult.redactionSummary,
    output: aiResult.output,
    outputChecksum: checksum,
    modelName: aiResult.modelName,
    tokenEstimate: aiResult.tokenEstimate
  };
}

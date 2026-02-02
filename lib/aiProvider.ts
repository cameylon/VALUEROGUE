import crypto from "crypto";
import { redactSensitive } from "./redaction";

export type AiOutput = {
  summary: string;
  supportsDelivered: string;
  clientResponse: string;
  risksIncidents: string;
  followUps: string;
  missingFields: string[];
  explainability: string;
  confidenceBanner: string;
  escalationGuidance?: string;
};

export type AiRunResult = {
  output: AiOutput;
  redactionSummary: string;
  checksum: string;
  modelName: string;
  tokenEstimate: number;
};

export interface AiProvider {
  generateCareNote(input: { text: string; clientLabel: string; staffLabel: string }): Promise<AiRunResult>;
}

export class MockAiProvider implements AiProvider {
  async generateCareNote({ text }: { text: string; clientLabel: string; staffLabel: string }): Promise<AiRunResult> {
    const { redactedText, summary } = redactSensitive(text);
    const emergencyTrigger = /(self-harm|suicide|emergency|000|unresponsive|overdose)/i.test(redactedText);
    const missingFields = ["Time of support", "Outcome", "Next steps"].filter((field) =>
      !redactedText.toLowerCase().includes(field.split(" ")[0].toLowerCase())
    );
    const output: AiOutput = {
      summary: `Support summary based on staff note: ${redactedText.slice(0, 120)}...`,
      supportsDelivered: "Daily living assistance, medication prompts, community access support.",
      clientResponse: "Client engaged positively with prompts and required minimal reassurance.",
      risksIncidents: "No incidents observed. Monitor for fatigue and hydration.",
      followUps: "Next shift to review hydration plan and sleep routine.",
      missingFields,
      explainability: "These fields ensure the note is defensible and meets NDIS quality standards.",
      confidenceBanner: "Confidence: Draft only. Please review for accuracy and completeness.",
      escalationGuidance: emergencyTrigger
        ? "Emergency or self-harm indicators detected. Escalate immediately: call 000 and notify your manager. Submission is blocked until acknowledged."
        : undefined
    };
    const checksum = crypto.createHash("sha256").update(JSON.stringify(output)).digest("hex");
    return {
      output,
      redactionSummary: summary,
      checksum,
      modelName: "mock-gpt-lds",
      tokenEstimate: Math.ceil(redactedText.length / 4)
    };
  }
}

export function getAiProvider(): AiProvider {
  if (process.env.AI_PROVIDER === "openai" && process.env.OPENAI_API_KEY) {
    return new MockAiProvider();
  }
  return new MockAiProvider();
}

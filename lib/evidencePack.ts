import crypto from "crypto";
import { prisma } from "./prisma";
import { generateEvidencePackPdf } from "./pdf";
import { getStorageProvider } from "./storage";
import { logAuditEvent } from "./audit";

export async function generateEvidencePackForIncident({
  incidentId,
  userId,
  ip
}: {
  incidentId: string;
  userId: string;
  ip?: string | null;
}) {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: { client: true }
  });
  if (!incident) {
    throw new Error("Incident not found");
  }

  const auditEvents = await prisma.auditEvent.findMany({
    where: { entityId: incident.id },
    orderBy: { createdAt: "asc" }
  });

  const approvals = await prisma.approvalRequest.findMany({
    where: { entityId: incident.id },
    orderBy: { decidedAt: "asc" }
  });

  const pdfBuffer = await generateEvidencePackPdf({
    incidentId: incident.id,
    incidentSummary: incident.description,
    timeline: auditEvents.map((event) => `${event.createdAt.toISOString()} - ${event.action}`),
    approvals: approvals.map((approval) => `${approval.status} (${approval.requiredRole})`)
  });

  const hash = crypto.createHash("sha256").update(pdfBuffer).digest("hex");
  const storage = getStorageProvider();
  const filePath = await storage.saveFile(`evidence/${incident.id}.pdf`, pdfBuffer);

  const evidencePack = await prisma.evidencePack.create({
    data: {
      incidentId: incident.id,
      generatedByUserId: userId,
      filePath,
      hash
    }
  });

  await logAuditEvent({
    actorUserId: userId,
    action: "incident.evidencePackGenerated",
    entityType: "Incident",
    entityId: incident.id,
    metadata: { evidencePackId: evidencePack.id, hash },
    ip: ip ?? undefined
  });

  return evidencePack;
}

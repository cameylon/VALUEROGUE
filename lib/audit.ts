import { prisma } from "./prisma";

export async function logAuditEvent({
  actorUserId,
  action,
  entityType,
  entityId,
  metadata,
  ip
}: {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  ip?: string | null;
}) {
  return prisma.auditEvent.create({
    data: {
      actorUserId,
      action,
      entityType,
      entityId,
      metadataJson: metadata,
      ip: ip ?? undefined
    }
  });
}

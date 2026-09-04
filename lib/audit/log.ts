import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type AuditLogInput = {
  tenantId: string;
  organizationId?: string | null;
  userId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  previousValues?: Prisma.InputJsonValue;
  newValues?: Prisma.InputJsonValue;
};

export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: input.tenantId,
        organizationId: input.organizationId ?? null,
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        previousValues: input.previousValues ?? undefined,
        newValues: input.newValues ?? undefined,
      },
    });
  } catch (error) {
    console.error("[AuditLog] Failed to write:", error);
  }
}

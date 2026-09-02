import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/log";
import { deriveChargeStatus, money, moneyToNumber } from "./money";

/** Cargo puntual (reserva, multa, etc.) sin Fee — fuente de verdad financiera. */
export async function createAdHocCharge(input: {
  tenantId: string;
  organizationId: string;
  unitId: string;
  residentId?: number | null;
  concept: string;
  amount: number;
  dueDate?: Date;
  issueDate?: Date;
  userId?: string | null;
}) {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Monto inválido");
  }

  const unit = await prisma.unit.findFirst({
    where: {
      id: input.unitId,
      property: {
        tenantId: input.tenantId,
        OR: [
          { organizationId: input.organizationId },
          { organizationId: null },
        ],
      },
    },
  });
  if (!unit) throw new Error("Unidad no encontrada");

  const amount = money(input.amount);
  const dueDate = input.dueDate ?? new Date();
  const issueDate = input.issueDate ?? new Date();

  const charge = await prisma.charge.create({
    data: {
      tenantId: input.tenantId,
      organizationId: input.organizationId,
      feeId: null,
      unitId: input.unitId,
      residentId: input.residentId ?? null,
      concept: input.concept.trim(),
      amount,
      outstandingAmount: amount,
      issueDate,
      dueDate,
      status: deriveChargeStatus(amount, amount, dueDate),
    },
  });

  await writeAuditLog({
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    userId: input.userId,
    action: "create",
    entity: "Charge",
    entityId: charge.id,
    newValues: {
      concept: charge.concept,
      amount: moneyToNumber(charge.amount),
      source: "adhoc",
    },
  });

  return charge;
}

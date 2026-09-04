import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { writeAuditLog } from "@/lib/audit/log";
import {
  CHARGE_STATUS,
  deriveChargeStatus,
  money,
  moneyToNumber,
} from "./money";

export type CreateFeeInput = {
  tenantId: string;
  organizationId: string;
  name: string;
  concept: string;
  amount: number;
  dueDate: Date;
  issueDate?: Date;
  feeType?: string;
  recurrence?: string;
  periodMonth?: number | null;
  periodYear?: number | null;
  appliesTo?: string;
  createdById?: string;
};

export async function createFee(input: CreateFeeInput) {
  const fee = await prisma.fee.create({
    data: {
      tenantId: input.tenantId,
      organizationId: input.organizationId,
      name: input.name.trim(),
      concept: input.concept.trim(),
      amount: money(input.amount),
      dueDate: input.dueDate,
      issueDate: input.issueDate ?? new Date(),
      feeType: input.feeType ?? "ordinary",
      recurrence: input.recurrence ?? "once",
      periodMonth: input.periodMonth ?? null,
      periodYear: input.periodYear ?? null,
      appliesTo: input.appliesTo ?? "all_active_units",
      createdById: input.createdById ?? null,
    },
  });

  await writeAuditLog({
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    userId: input.createdById,
    action: "create",
    entity: "Fee",
    entityId: fee.id,
    newValues: { name: fee.name, amount: moneyToNumber(fee.amount) },
  });

  return fee;
}

/**
 * Genera cargos para unidades activas de la organización.
 * Idempotente: unique(feeId, unitId) — no duplica.
 */
export async function generateChargesForFee(params: {
  feeId: string;
  tenantId: string;
  organizationId: string;
  userId?: string;
  unitIds?: string[];
}): Promise<{ created: number; skipped: number }> {
  const fee = await prisma.fee.findFirst({
    where: {
      id: params.feeId,
      tenantId: params.tenantId,
      organizationId: params.organizationId,
    },
  });
  if (!fee) throw new Error("Fee not found");

  const properties = await prisma.property.findMany({
    where: {
      tenantId: params.tenantId,
      OR: [
        { organizationId: params.organizationId },
        { organizationId: null },
      ],
    },
    select: { id: true },
  });
  const propertyIds = properties.map((p) => p.id);

  const units = await prisma.unit.findMany({
    where: {
      propertyId: { in: propertyIds },
      status: { in: ["available", "occupied", "reserved"] },
      ...(params.unitIds?.length ? { id: { in: params.unitIds } } : {}),
    },
    include: {
      occupancies: {
        where: { status: "active" },
        orderBy: [{ isResponsibleForPayment: "desc" }, { isPrimary: "desc" }],
        take: 1,
      },
    },
  });

  let created = 0;
  let skipped = 0;

  await prisma.$transaction(async (tx) => {
    for (const unit of units) {
      const existing = await tx.charge.findUnique({
        where: { feeId_unitId: { feeId: fee.id, unitId: unit.id } },
      });
      if (existing) {
        skipped += 1;
        continue;
      }

      const responsible = unit.occupancies[0];
      await tx.charge.create({
        data: {
          tenantId: params.tenantId,
          organizationId: params.organizationId,
          feeId: fee.id,
          unitId: unit.id,
          residentId: responsible?.residentId ?? null,
          concept: fee.concept,
          amount: fee.amount,
          outstandingAmount: fee.amount,
          issueDate: fee.issueDate,
          dueDate: fee.dueDate,
          status: deriveChargeStatus(fee.amount, fee.amount, fee.dueDate),
        },
      });
      created += 1;
    }
  });

  await writeAuditLog({
    tenantId: params.tenantId,
    organizationId: params.organizationId,
    userId: params.userId,
    action: "generate_charges",
    entity: "Fee",
    entityId: fee.id,
    newValues: { created, skipped },
  });

  return { created, skipped };
}

/**
 * Job mensual sencillo: crea Fee + charges si no existe para el período.
 */
export async function ensureMonthlyFee(params: {
  tenantId: string;
  organizationId: string;
  name: string;
  concept: string;
  amount: number;
  month: number;
  year: number;
  dueDay?: number;
  userId?: string;
}) {
  const dueDay = params.dueDay ?? 30;
  const existing = await prisma.fee.findFirst({
    where: {
      tenantId: params.tenantId,
      organizationId: params.organizationId,
      periodMonth: params.month,
      periodYear: params.year,
      recurrence: "monthly",
      status: "ACTIVE",
    },
  });
  if (existing) {
    return {
      fee: existing,
      charges: await generateChargesForFee({
        feeId: existing.id,
        tenantId: params.tenantId,
        organizationId: params.organizationId,
        userId: params.userId,
      }),
      created: false,
    };
  }

  const dueDate = new Date(params.year, params.month - 1, Math.min(dueDay, 28));
  const fee = await createFee({
    tenantId: params.tenantId,
    organizationId: params.organizationId,
    name: `${params.name} ${params.month}/${params.year}`,
    concept: params.concept,
    amount: params.amount,
    dueDate,
    feeType: "ordinary",
    recurrence: "monthly",
    periodMonth: params.month,
    periodYear: params.year,
    createdById: params.userId,
  });

  const charges = await generateChargesForFee({
    feeId: fee.id,
    tenantId: params.tenantId,
    organizationId: params.organizationId,
    userId: params.userId,
  });

  return { fee, charges, created: true };
}

export async function refreshChargeStatuses(
  tenantId: string,
  organizationId: string
) {
  const now = new Date();
  const charges = await prisma.charge.findMany({
    where: {
      tenantId,
      organizationId,
      status: { in: [CHARGE_STATUS.PENDING, CHARGE_STATUS.PARTIAL, CHARGE_STATUS.OVERDUE] },
    },
  });

  for (const c of charges) {
    const next = deriveChargeStatus(c.outstandingAmount, c.amount, c.dueDate, now);
    if (next !== c.status) {
      await prisma.charge.update({
        where: { id: c.id },
        data: { status: next },
      });
    }
  }
}

export type UnitBalance = {
  unitId: string;
  totalCharges: number;
  totalOutstanding: number;
  totalOverdue: number;
  creditAvailable: number;
  balance: number;
  maxDaysOverdue: number;
};

export async function getUnitBalance(
  tenantId: string,
  organizationId: string,
  unitId: string
): Promise<UnitBalance> {
  const now = new Date();
  const charges = await prisma.charge.findMany({
    where: {
      tenantId,
      organizationId,
      unitId,
      status: { not: CHARGE_STATUS.CANCELLED },
    },
  });

  const credit = await prisma.unitCredit.findFirst({
    where: { tenantId, organizationId, unitId },
  });

  let totalCharges = money(0);
  let totalOutstanding = money(0);
  let totalOverdue = money(0);
  let maxDaysOverdue = 0;

  for (const c of charges) {
    totalCharges = totalCharges.plus(c.amount);
    totalOutstanding = totalOutstanding.plus(c.outstandingAmount);
    if (moneyToNumber(c.outstandingAmount) > 0 && c.dueDate < now) {
      totalOverdue = totalOverdue.plus(c.outstandingAmount);
      const days = Math.floor(
        (now.getTime() - c.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      maxDaysOverdue = Math.max(maxDaysOverdue, days);
    }
  }

  const creditAvailable = credit ? money(credit.amount) : money(0);
  const balance = totalOutstanding.minus(creditAvailable);

  return {
    unitId,
    totalCharges: moneyToNumber(totalCharges),
    totalOutstanding: moneyToNumber(totalOutstanding),
    totalOverdue: moneyToNumber(totalOverdue),
    creditAvailable: moneyToNumber(creditAvailable),
    balance: moneyToNumber(balance.lessThan(0) ? money(0) : balance),
    maxDaysOverdue,
  };
}

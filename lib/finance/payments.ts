import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { writeAuditLog } from "@/lib/audit/log";
import {
  CHARGE_STATUS,
  PAYMENT_STATUS,
  RECEIPT_STATUS,
  deriveChargeStatus,
  money,
  moneyMin,
  moneySub,
  moneyToNumber,
} from "./money";
import { getUnitBalance } from "./fees";

export type RegisterPaymentInput = {
  tenantId: string;
  organizationId: string;
  unitId: string;
  amount: number;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  paymentDate?: Date;
  residentId?: number | null;
  chargeIds?: string[];
  registeredByUserId: string;
};

async function nextReceiptNumber(
  tx: Prisma.TransactionClient,
  tenantId: string,
  organizationId: string,
  year: number
): Promise<string> {
  const seq = await tx.receiptSequence.upsert({
    where: {
      organizationId_year: { organizationId, year },
    },
    create: {
      tenantId,
      organizationId,
      year,
      lastNumber: 1,
    },
    update: {
      lastNumber: { increment: 1 },
    },
  });
  const n = String(seq.lastNumber).padStart(6, "0");
  return `REC-${year}-${n}`;
}

/**
 * Regla de aplicación automática:
 * 1. Cargos vencidos más antiguos primero
 * 2. Luego pendientes más antiguos
 * Si chargeIds se provee, solo esos (en orden de dueDate).
 */
export async function registerPayment(input: RegisterPaymentInput) {
  if (input.amount <= 0) throw new Error("Amount must be > 0");

  const unit = await prisma.unit.findFirst({
    where: {
      id: input.unitId,
      property: {
        tenantId: input.tenantId,
      },
    },
    include: { property: true },
  });
  if (!unit) throw new Error("Unit not found");

  return prisma.$transaction(async (tx) => {
    const chargeWhere: Prisma.ChargeWhereInput = {
      tenantId: input.tenantId,
      organizationId: input.organizationId,
      unitId: input.unitId,
      status: {
        in: [
          CHARGE_STATUS.PENDING,
          CHARGE_STATUS.PARTIAL,
          CHARGE_STATUS.OVERDUE,
        ],
      },
      outstandingAmount: { gt: 0 },
      ...(input.chargeIds?.length ? { id: { in: input.chargeIds } } : {}),
    };

    const charges = await tx.charge.findMany({
      where: chargeWhere,
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
    });

    const payment = await tx.payment.create({
      data: {
        tenantId: input.tenantId,
        organizationId: input.organizationId,
        unitId: input.unitId,
        residentId: input.residentId ?? null,
        amount: money(input.amount),
        status: PAYMENT_STATUS.CONFIRMED,
        paymentDate: input.paymentDate ?? new Date(),
        paymentMethod: input.paymentMethod ?? "other",
        reference: input.reference ?? null,
        notes: input.notes ?? null,
        createdById: input.registeredByUserId,
        dueDate: null,
      },
    });

    let remaining = money(input.amount);
    const applications: { chargeId: string; amount: Prisma.Decimal }[] = [];
    const concepts: { concept: string; amount: number }[] = [];

    for (const charge of charges) {
      if (remaining.lessThanOrEqualTo(0)) break;
      const apply = moneyMin(remaining, charge.outstandingAmount);
      if (apply.lessThanOrEqualTo(0)) continue;

      await tx.paymentApplication.create({
        data: {
          paymentId: payment.id,
          chargeId: charge.id,
          amount: apply,
        },
      });

      const newOutstanding = moneySub(charge.outstandingAmount, apply);
      const newStatus = deriveChargeStatus(
        newOutstanding,
        charge.amount,
        charge.dueDate
      );

      await tx.charge.update({
        where: { id: charge.id },
        data: {
          outstandingAmount: newOutstanding,
          status: newStatus,
        },
      });

      applications.push({ chargeId: charge.id, amount: apply });
      concepts.push({
        concept: charge.concept,
        amount: moneyToNumber(apply),
      });
      remaining = moneySub(remaining, apply);
    }

    // Crédito / anticipo si sobra
    if (remaining.greaterThan(0)) {
      const existing = await tx.unitCredit.findFirst({
        where: {
          tenantId: input.tenantId,
          organizationId: input.organizationId,
          unitId: input.unitId,
        },
      });
      if (existing) {
        await tx.unitCredit.update({
          where: { id: existing.id },
          data: {
            amount: money(existing.amount).plus(remaining),
            sourcePaymentId: payment.id,
          },
        });
      } else {
        await tx.unitCredit.create({
          data: {
            tenantId: input.tenantId,
            organizationId: input.organizationId,
            unitId: input.unitId,
            amount: remaining,
            sourcePaymentId: payment.id,
            notes: "Anticipo / crédito por pago excedente",
          },
        });
      }
      concepts.push({
        concept: "Crédito a favor",
        amount: moneyToNumber(remaining),
      });
    }

    const year = (input.paymentDate ?? new Date()).getFullYear();
    const receiptNumber = await nextReceiptNumber(
      tx,
      input.tenantId,
      input.organizationId,
      year
    );

    const receipt = await tx.receipt.create({
      data: {
        tenantId: input.tenantId,
        organizationId: input.organizationId,
        paymentId: payment.id,
        number: receiptNumber,
        amount: money(input.amount),
        status: RECEIPT_STATUS.ISSUED,
        method: input.paymentMethod ?? "other",
        reference: input.reference ?? null,
        unitCode: unit.code,
        issuedById: input.registeredByUserId,
        conceptsJson: concepts,
      },
    });

    await writeAuditLog({
      tenantId: input.tenantId,
      organizationId: input.organizationId,
      userId: input.registeredByUserId,
      action: "create",
      entity: "Payment",
      entityId: String(payment.id),
      newValues: {
        amount: input.amount,
        applications: applications.map((a) => ({
          chargeId: a.chargeId,
          amount: moneyToNumber(a.amount),
        })),
        receiptNumber,
        credit: moneyToNumber(remaining),
      },
    });

    return {
      payment,
      receipt,
      applications: applications.map((a) => ({
        chargeId: a.chargeId,
        amount: moneyToNumber(a.amount),
      })),
      creditCreated: moneyToNumber(remaining),
    };
  }).then(async (result) => {
    const balance = await getUnitBalance(
      input.tenantId,
      input.organizationId,
      input.unitId
    );
    return { ...result, balance };
  });
}

/**
 * Anula pago (VOID), revierte aplicaciones, restaura cargos, anula recibo.
 * No elimina filas.
 */
export async function voidPayment(params: {
  paymentId: number;
  tenantId: string;
  organizationId: string;
  userId: string;
  reason: string;
}) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({
      where: {
        id: params.paymentId,
        tenantId: params.tenantId,
        organizationId: params.organizationId,
      },
      include: {
        applications: true,
        receipts: true,
      },
    });
    if (!payment) throw new Error("Payment not found");
    if (payment.status === PAYMENT_STATUS.VOID) {
      throw new Error("Payment already void");
    }

    for (const app of payment.applications) {
      if (app.reversedAt) continue;
      const charge = await tx.charge.findUnique({ where: { id: app.chargeId } });
      if (charge) {
        const newOutstanding = money(charge.outstandingAmount).plus(app.amount);
        // Cap at original amount
        const capped = newOutstanding.greaterThan(charge.amount)
          ? money(charge.amount)
          : newOutstanding;
        await tx.charge.update({
          where: { id: charge.id },
          data: {
            outstandingAmount: capped,
            status: deriveChargeStatus(capped, charge.amount, charge.dueDate),
          },
        });
      }
      await tx.paymentApplication.update({
        where: { id: app.id },
        data: { reversedAt: new Date() },
      });
    }

    // Revert credit from this payment if any
    if (payment.unitId) {
      const credit = await tx.unitCredit.findFirst({
        where: {
          tenantId: params.tenantId,
          organizationId: params.organizationId,
          unitId: payment.unitId,
          sourcePaymentId: payment.id,
        },
      });
      if (credit) {
        const appsSum = payment.applications.reduce(
          (s, a) => s.plus(a.amount),
          money(0)
        );
        const creditPart = money(payment.amount).minus(appsSum);
        if (creditPart.greaterThan(0)) {
          const next = money(credit.amount).minus(creditPart);
          if (next.lessThanOrEqualTo(0)) {
            await tx.unitCredit.delete({ where: { id: credit.id } });
          } else {
            await tx.unitCredit.update({
              where: { id: credit.id },
              data: { amount: next },
            });
          }
        }
      }
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PAYMENT_STATUS.VOID,
        voidedAt: new Date(),
        voidedById: params.userId,
        voidReason: params.reason,
      },
    });

    for (const receipt of payment.receipts) {
      if (receipt.status === RECEIPT_STATUS.ISSUED) {
        await tx.receipt.update({
          where: { id: receipt.id },
          data: {
            status: RECEIPT_STATUS.VOID,
            voidedAt: new Date(),
            voidedById: params.userId,
            voidReason: params.reason,
          },
        });
      }
    }

    await writeAuditLog({
      tenantId: params.tenantId,
      organizationId: params.organizationId,
      userId: params.userId,
      action: "void",
      entity: "Payment",
      entityId: String(payment.id),
      previousValues: { status: payment.status, amount: moneyToNumber(payment.amount) },
      newValues: { status: PAYMENT_STATUS.VOID, reason: params.reason },
    });

    return { ok: true, paymentId: payment.id };
  });
}

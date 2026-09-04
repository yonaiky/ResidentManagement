import { prisma } from "@/lib/prisma";
import {
  arrearsBucket,
  daysBetween,
  moneyToNumber,
} from "./money";
import { getUnitBalance } from "./fees";

export type StatementLine = {
  date: string;
  concept: string;
  type: "CHARGE" | "PAYMENT" | "CREDIT" | "VOID";
  charge: number;
  payment: number;
  credit: number;
  balance: number;
  entityId: string;
};

/**
 * Estado de cuenta cronológico. Balance corrido calculado en backend.
 */
export async function getUnitStatement(params: {
  tenantId: string;
  organizationId: string;
  unitId: string;
}): Promise<{
  lines: StatementLine[];
  balance: Awaited<ReturnType<typeof getUnitBalance>>;
}> {
  const charges = await prisma.charge.findMany({
    where: {
      tenantId: params.tenantId,
      organizationId: params.organizationId,
      unitId: params.unitId,
    },
    orderBy: { issueDate: "asc" },
  });

  const payments = await prisma.payment.findMany({
    where: {
      tenantId: params.tenantId,
      organizationId: params.organizationId,
      unitId: params.unitId,
    },
    orderBy: { paymentDate: "asc" },
  });

  type Event = {
    at: Date;
    sort: number;
    line: Omit<StatementLine, "balance">;
  };

  const events: Event[] = [];

  for (const c of charges) {
    events.push({
      at: c.issueDate,
      sort: 0,
      line: {
        date: c.issueDate.toISOString(),
        concept: c.concept,
        type: "CHARGE",
        charge: moneyToNumber(c.amount),
        payment: 0,
        credit: 0,
        entityId: c.id,
      },
    });
  }

  for (const p of payments) {
    const isVoid = p.status === "VOID";
    events.push({
      at: p.paymentDate,
      sort: 1,
      line: {
        date: p.paymentDate.toISOString(),
        concept: isVoid
          ? `Pago anulado${p.reference ? ` #${p.reference}` : ""}`
          : `Pago${p.reference ? ` #${p.reference}` : ""} (${p.paymentMethod})`,
        type: isVoid ? "VOID" : "PAYMENT",
        charge: 0,
        payment: isVoid ? 0 : moneyToNumber(p.amount),
        credit: 0,
        entityId: String(p.id),
      },
    });
  }

  events.sort((a, b) => {
    const d = a.at.getTime() - b.at.getTime();
    if (d !== 0) return d;
    return a.sort - b.sort;
  });

  let running = 0;
  const lines: StatementLine[] = events.map((e) => {
    running += e.line.charge - e.line.payment + e.line.credit;
    return { ...e.line, balance: Math.round(running * 100) / 100 };
  });

  const balance = await getUnitBalance(
    params.tenantId,
    params.organizationId,
    params.unitId
  );

  return { lines, balance };
}

export type ReceivableRow = {
  unitId: string;
  unitCode: string;
  propertyName: string;
  responsibleName: string | null;
  totalDebt: number;
  overdue: number;
  notOverdue: number;
  lastPaymentDate: string | null;
  maxDaysOverdue: number;
  arrearsBucket: string | null;
};

export async function getReceivables(params: {
  tenantId: string;
  organizationId: string;
}): Promise<ReceivableRow[]> {
  const now = new Date();
  const units = await prisma.unit.findMany({
    where: {
      property: {
        tenantId: params.tenantId,
        OR: [
          { organizationId: params.organizationId },
          { organizationId: null },
        ],
      },
    },
    include: {
      property: { select: { name: true } },
      occupancies: {
        where: { status: "active" },
        orderBy: [
          { isResponsibleForPayment: "desc" },
          { isPrimary: "desc" },
        ],
        take: 1,
        include: {
          resident: { select: { name: true, lastName: true } },
        },
      },
      charges: {
        where: {
          organizationId: params.organizationId,
          outstandingAmount: { gt: 0 },
          status: { not: "CANCELLED" },
        },
      },
      payments: {
        where: {
          organizationId: params.organizationId,
          status: { in: ["CONFIRMED", "completed"] },
        },
        orderBy: { paymentDate: "desc" },
        take: 1,
      },
    },
  });

  const rows: ReceivableRow[] = [];

  for (const unit of units) {
    if (unit.charges.length === 0) continue;

    let overdue = 0;
    let notOverdue = 0;
    let maxDays = 0;

    for (const c of unit.charges) {
      const amt = moneyToNumber(c.outstandingAmount);
      if (c.dueDate < now) {
        overdue += amt;
        maxDays = Math.max(maxDays, daysBetween(c.dueDate, now));
      } else {
        notOverdue += amt;
      }
    }

    const resp = unit.occupancies[0]?.resident;
    rows.push({
      unitId: unit.id,
      unitCode: unit.code,
      propertyName: unit.property.name,
      responsibleName: resp ? `${resp.name} ${resp.lastName}` : null,
      totalDebt: Math.round((overdue + notOverdue) * 100) / 100,
      overdue: Math.round(overdue * 100) / 100,
      notOverdue: Math.round(notOverdue * 100) / 100,
      lastPaymentDate: unit.payments[0]?.paymentDate.toISOString() ?? null,
      maxDaysOverdue: maxDays,
      arrearsBucket: maxDays > 0 ? arrearsBucket(maxDays) : null,
    });
  }

  return rows.sort((a, b) => b.totalDebt - a.totalDebt);
}

export async function getFinanceDashboardStats(params: {
  tenantId: string;
  organizationId: string;
}) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [paymentsMonth, expensesMonth, receivables, chargesOpen] =
    await Promise.all([
      prisma.payment.aggregate({
        where: {
          tenantId: params.tenantId,
          organizationId: params.organizationId,
          status: { in: ["CONFIRMED", "completed"] },
          paymentDate: { gte: monthStart },
        },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: {
          tenantId: params.tenantId,
          organizationId: params.organizationId,
          status: "ACTIVE",
          expenseDate: { gte: monthStart },
        },
        _sum: { amount: true },
      }),
      getReceivables(params),
      prisma.charge.groupBy({
        by: ["unitId", "status"],
        where: {
          tenantId: params.tenantId,
          organizationId: params.organizationId,
          outstandingAmount: { gt: 0 },
        },
        _count: { id: true },
      }),
    ]);

  const income = moneyToNumber(paymentsMonth._sum.amount);
  const expenses = moneyToNumber(expensesMonth._sum.amount);
  const accountsReceivable = receivables.reduce((s, r) => s + r.totalDebt, 0);
  const overdueTotal = receivables.reduce((s, r) => s + r.overdue, 0);

  const unitIdsWithDebt = new Set(receivables.map((r) => r.unitId));
  const unitsOverdue = receivables.filter((r) => r.overdue > 0).length;
  const unitsPending = unitIdsWithDebt.size - unitsOverdue;

  return {
    incomeMonth: income,
    expensesMonth: expenses,
    operatingBalance: Math.round((income - expenses) * 100) / 100,
    accountsReceivable: Math.round(accountsReceivable * 100) / 100,
    overdueTotal: Math.round(overdueTotal * 100) / 100,
    unitsCurrent: Math.max(0, 0), // filled by caller with total units if needed
    unitsPending: Math.max(0, unitsPending),
    unitsOverdue,
    receivablesCount: receivables.length,
  };
}

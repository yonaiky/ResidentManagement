import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DASHBOARD_COLORS, MONTH_LABELS } from "@/lib/dashboard/constants";
import {
  buildArrearsWhere,
  buildPaymentWhere,
  buildResidentWhere,
  buildTokenWhere,
  parseReportsSearchParams,
  resolveDateRange,
} from "@/lib/reports/filters";
import type {
  ArrearsReportRow,
  MonthlyBreakdownItem,
  PaymentReportRow,
  ReportsResponse,
  ReportsSummary,
  ResidentReportRow,
  StatusBreakdownItem,
  TokenReportRow,
} from "@/lib/reports/types";

function monthName(month: number) {
  return new Date(2000, month - 1).toLocaleString("es", { month: "long" });
}

export async function GET(request: NextRequest) {
  try {
    const filters = parseReportsSearchParams(request.nextUrl.searchParams);
    const range = resolveDateRange(filters);
    const skip = (filters.page - 1) * filters.pageSize;

    if (filters.reportType === "payments") {
      const where = buildPaymentWhere(filters, range);
      const [total, payments, aggregates] = await Promise.all([
        prisma.payment.count({ where }),
        prisma.payment.findMany({
          where,
          include: {
            resident: {
              select: {
                name: true,
                lastName: true,
                cedula: true,
                noRegistro: true,
              },
            },
          },
          orderBy:
            filters.sortBy === "amount"
              ? { amount: filters.sortOrder }
              : filters.sortBy === "name"
                ? { resident: { name: filters.sortOrder } }
                : { paymentDate: filters.sortOrder },
          skip,
          take: filters.pageSize,
        }),
        prisma.payment.groupBy({
          by: ["status"],
          where,
          _sum: { amount: true },
          _count: { id: true },
        }),
      ]);

      const rows: PaymentReportRow[] = payments.map((p) => ({
        id: p.id,
        residentId: p.residentId,
        residentName: `${p.resident.name} ${p.resident.lastName}`,
        cedula: p.resident.cedula,
        noRegistro: p.resident.noRegistro ?? "",
        amount: p.amount,
        status: p.status,
        paymentDate: p.paymentDate?.toISOString() ?? null,
        dueDate: p.dueDate.toISOString(),
        month: p.month,
        year: p.year,
        monthName: monthName(p.month),
      }));

      const summary = buildPaymentSummary(aggregates, total);
      const statusBreakdown = buildStatusBreakdown(aggregates);
      const monthlyBreakdown = await buildPaymentMonthlyBreakdown(where);

      return jsonResponse(filters, range, summary, statusBreakdown, monthlyBreakdown, rows, total);
    }

    if (filters.reportType === "residents") {
      const where = buildResidentWhere(filters, range);
      const [total, residents] = await Promise.all([
        prisma.resident.count({ where }),
        prisma.resident.findMany({
          where,
          include: {
            payments: {
              select: { amount: true, status: true },
            },
            tokens: {
              where: { status: "active" },
              select: { id: true },
            },
          },
          orderBy:
            filters.sortBy === "name"
              ? { name: filters.sortOrder }
              : { createdAt: filters.sortOrder },
          skip,
          take: filters.pageSize,
        }),
      ]);

      const statusGroups = await prisma.resident.groupBy({
        by: ["paymentStatus"],
        where,
        _count: { id: true },
      });

      const rows: ResidentReportRow[] = residents.map((r) => {
        const totalPaid = r.payments
          .filter((p) => p.status === "completed")
          .reduce((s, p) => s + p.amount, 0);
        const pendingAmount = r.payments
          .filter((p) => p.status === "pending" || p.status === "overdue")
          .reduce((s, p) => s + p.amount, 0);

        return {
          id: r.id,
          name: `${r.name} ${r.lastName}`,
          cedula: r.cedula,
          noRegistro: r.noRegistro ?? "",
          phone: r.phone,
          paymentStatus: r.paymentStatus,
          lastPaymentDate: r.lastPaymentDate?.toISOString() ?? null,
          nextPaymentDate: r.nextPaymentDate?.toISOString() ?? null,
          totalPaid,
          pendingAmount,
          activeTokens: r.tokens.length,
          createdAt: r.createdAt.toISOString(),
        };
      });

      const allPayments = await prisma.payment.aggregate({
        where: {
          resident: where,
          status: "completed",
        },
        _sum: { amount: true },
      });
      const pendingPayments = await prisma.payment.aggregate({
        where: {
          resident: where,
          status: { in: ["pending", "overdue"] },
        },
        _sum: { amount: true },
      });

      const summary: ReportsSummary = {
        totalRecords: total,
        totalAmount: (allPayments._sum.amount ?? 0) + (pendingPayments._sum.amount ?? 0),
        completedAmount: allPayments._sum.amount ?? 0,
        pendingAmount: pendingPayments._sum.amount ?? 0,
        overdueAmount: 0,
        averageAmount: total > 0 ? (allPayments._sum.amount ?? 0) / total : 0,
        collectionRate:
          total > 0
            ? Math.round(
                ((statusGroups.find((s) => s.paymentStatus === "paid" || s.paymentStatus === "completed")
                  ?._count.id ?? 0) /
                  total) *
                  100
              )
            : 0,
        activeTokens: await prisma.token.count({
          where: { status: "active", resident: where },
        }),
      };

      const statusBreakdown: StatusBreakdownItem[] = statusGroups.map((g) => ({
        name: labelPaymentStatus(g.paymentStatus),
        value: g._count.id,
        fill: statusColor(g.paymentStatus),
      }));

      const monthlyBreakdown = await buildResidentMonthlyBreakdown(where);

      return jsonResponse(filters, range, summary, statusBreakdown, monthlyBreakdown, rows, total);
    }

    if (filters.reportType === "tokens") {
      const where = buildTokenWhere(filters, range);
      const [total, tokens, statusGroups] = await Promise.all([
        prisma.token.count({ where }),
        prisma.token.findMany({
          where,
          include: {
            resident: {
              select: {
                name: true,
                lastName: true,
                noRegistro: true,
              },
            },
          },
          orderBy:
            filters.sortBy === "name"
              ? { name: filters.sortOrder }
              : { createdAt: filters.sortOrder },
          skip,
          take: filters.pageSize,
        }),
        prisma.token.groupBy({
          by: ["status"],
          where,
          _count: { id: true },
        }),
      ]);

      const rows: TokenReportRow[] = tokens.map((t) => ({
        id: t.id,
        name: t.name,
        status: t.status,
        residentId: t.residentId,
        residentName: `${t.resident.name} ${t.resident.lastName}`,
        noRegistro: t.resident.noRegistro ?? "",
        createdAt: t.createdAt.toISOString(),
      }));

      const activeCount =
        statusGroups.find((s) => s.status === "active")?._count.id ?? 0;

      const summary: ReportsSummary = {
        totalRecords: total,
        totalAmount: 0,
        completedAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        averageAmount: 0,
        collectionRate: total > 0 ? Math.round((activeCount / total) * 100) : 0,
        activeTokens: activeCount,
      };

      const statusBreakdown: StatusBreakdownItem[] = statusGroups.map((g) => ({
        name: g.status === "active" ? "Activos" : "Inactivos",
        value: g._count.id,
        fill: g.status === "active" ? DASHBOARD_COLORS.success : DASHBOARD_COLORS.warning,
      }));

      return jsonResponse(filters, range, summary, statusBreakdown, [], rows, total);
    }

    // Morosidad
    const where = buildArrearsWhere(filters);
    const residents = await prisma.resident.findMany({
      where,
      include: {
        payments: {
          where: { status: { in: ["pending", "overdue"] } },
          orderBy: { dueDate: "asc" },
        },
      },
    });

    let arrearsRows: ArrearsReportRow[] = residents.map((r) => {
      const pendingAmount =
        r.payments.length > 0
          ? r.payments.reduce((s, p) => s + p.amount, 0)
          : 700;
      const overdueCount = r.payments.filter((p) => p.status === "overdue").length;

      return {
        id: r.id,
        residentName: `${r.name} ${r.lastName}`,
        cedula: r.cedula,
        noRegistro: r.noRegistro ?? "",
        phone: r.phone,
        pendingAmount,
        oldestDueDate: r.payments[0]?.dueDate.toISOString() ?? r.nextPaymentDate?.toISOString() ?? null,
        overdueCount: overdueCount || (r.paymentStatus === "overdue" ? 1 : 0),
        paymentStatus: r.paymentStatus,
      };
    });

    if (filters.sortBy === "amount") {
      arrearsRows.sort((a, b) =>
        filters.sortOrder === "asc"
          ? a.pendingAmount - b.pendingAmount
          : b.pendingAmount - a.pendingAmount
      );
    } else if (filters.sortBy === "name") {
      arrearsRows.sort((a, b) =>
        filters.sortOrder === "asc"
          ? a.residentName.localeCompare(b.residentName)
          : b.residentName.localeCompare(a.residentName)
      );
    } else {
      arrearsRows.sort((a, b) => {
        const da = a.oldestDueDate ? new Date(a.oldestDueDate).getTime() : 0;
        const db = b.oldestDueDate ? new Date(b.oldestDueDate).getTime() : 0;
        return filters.sortOrder === "asc" ? da - db : db - da;
      });
    }

    const min = parseFloat(filters.minAmount);
    const max = parseFloat(filters.maxAmount);
    if (Number.isFinite(min)) {
      arrearsRows = arrearsRows.filter((r) => r.pendingAmount >= min);
    }
    if (Number.isFinite(max)) {
      arrearsRows = arrearsRows.filter((r) => r.pendingAmount <= max);
    }

    const total = arrearsRows.length;
    const rows = arrearsRows.slice(skip, skip + filters.pageSize);
    const totalPending = arrearsRows.reduce((s, r) => s + r.pendingAmount, 0);

    const summary: ReportsSummary = {
      totalRecords: total,
      totalAmount: totalPending,
      completedAmount: 0,
      pendingAmount: totalPending,
      overdueAmount: totalPending,
      averageAmount: total > 0 ? totalPending / total : 0,
      collectionRate: 0,
      residentsAtRisk: total,
    };

    const statusBreakdown: StatusBreakdownItem[] = [
      {
        name: "Morosos",
        value: arrearsRows.filter((r) => r.paymentStatus === "overdue").length,
        amount: arrearsRows
          .filter((r) => r.paymentStatus === "overdue")
          .reduce((s, r) => s + r.pendingAmount, 0),
        fill: DASHBOARD_COLORS.danger,
      },
      {
        name: "Pendientes",
        value: arrearsRows.filter((r) => r.paymentStatus === "pending").length,
        amount: arrearsRows
          .filter((r) => r.paymentStatus === "pending")
          .reduce((s, r) => s + r.pendingAmount, 0),
        fill: DASHBOARD_COLORS.warning,
      },
    ].filter((s) => s.value > 0);

    return jsonResponse(filters, range, summary, statusBreakdown, [], rows, total);
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Error al generar el reporte" },
      { status: 500 }
    );
  }
}

function buildPaymentSummary(
  aggregates: { status: string; _sum: { amount: number | null }; _count: { id: number } }[],
  total: number
): ReportsSummary {
  const completed = aggregates.find((a) => a.status === "completed");
  const pending = aggregates.find((a) => a.status === "pending");
  const overdue = aggregates.find((a) => a.status === "overdue");

  const completedAmount = completed?._sum.amount ?? 0;
  const pendingAmount = pending?._sum.amount ?? 0;
  const overdueAmount = overdue?._sum.amount ?? 0;
  const totalAmount = completedAmount + pendingAmount + overdueAmount;

  return {
    totalRecords: total,
    totalAmount,
    completedAmount,
    pendingAmount,
    overdueAmount,
    averageAmount: total > 0 ? totalAmount / total : 0,
    collectionRate:
      totalAmount > 0 ? Math.round((completedAmount / totalAmount) * 100) : 0,
  };
}

function buildStatusBreakdown(
  aggregates: { status: string; _sum: { amount: number | null }; _count: { id: number } }[]
): StatusBreakdownItem[] {
  return aggregates.map((a) => ({
    name: labelPaymentStatus(a.status),
    value: a._count.id,
    amount: a._sum.amount ?? 0,
    fill: statusColor(a.status),
  }));
}

async function buildPaymentMonthlyBreakdown(
  where: Prisma.PaymentWhereInput
): Promise<MonthlyBreakdownItem[]> {
  const payments = await prisma.payment.findMany({
    where,
    select: { month: true, year: true, amount: true, status: true },
  });

  const map = new Map<string, MonthlyBreakdownItem>();

  for (const p of payments) {
    const key = `${p.year}-${p.month}`;
    const existing = map.get(key) ?? {
      month: key,
      label: `${MONTH_LABELS[p.month - 1]} ${p.year}`,
      revenue: 0,
      pending: 0,
      count: 0,
    };
    existing.count += 1;
    if (p.status === "completed") existing.revenue += p.amount;
    else existing.pending += p.amount;
    map.set(key, existing);
  }

  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}

async function buildResidentMonthlyBreakdown(
  where: Prisma.ResidentWhereInput
): Promise<MonthlyBreakdownItem[]> {
  const residents = await prisma.resident.findMany({
    where,
    select: { createdAt: true },
  });

  const map = new Map<string, MonthlyBreakdownItem>();

  for (const r of residents) {
    const d = r.createdAt;
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const month = d.getMonth() + 1;
    const existing = map.get(key) ?? {
      month: key,
      label: `${MONTH_LABELS[month - 1]} ${d.getFullYear()}`,
      revenue: 0,
      pending: 0,
      count: 0,
    };
    existing.count += 1;
    map.set(key, existing);
  }

  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}

function labelPaymentStatus(status: string) {
  switch (status) {
    case "completed":
      return "Completados";
    case "pending":
      return "Pendientes";
    case "overdue":
      return "Vencidos";
    case "paid":
      return "Al día";
    default:
      return status;
  }
}

function statusColor(status: string) {
  switch (status) {
    case "completed":
    case "paid":
      return DASHBOARD_COLORS.success;
    case "pending":
      return DASHBOARD_COLORS.warning;
    case "overdue":
      return DASHBOARD_COLORS.danger;
    default:
      return DASHBOARD_COLORS.primary;
  }
}

function jsonResponse(
  filters: ReportsResponse["filters"],
  range: { from: Date | null; to: Date | null },
  summary: ReportsSummary,
  statusBreakdown: StatusBreakdownItem[],
  monthlyBreakdown: MonthlyBreakdownItem[],
  rows: ReportsResponse["rows"],
  total: number
) {
  const body: ReportsResponse = {
    summary,
    statusBreakdown,
    monthlyBreakdown,
    rows,
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
    },
    filters,
    dateRange: {
      from: range.from?.toISOString() ?? null,
      to: range.to?.toISOString() ?? null,
    },
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json(body);
}

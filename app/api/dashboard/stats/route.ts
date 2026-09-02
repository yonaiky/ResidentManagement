import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAuth } from "@/lib/tenant/auth";
import { mergeTenantWhere } from "@/lib/tenant/scope";
import { MONTH_LABELS, DAY_LABELS, DASHBOARD_COLORS } from "@/lib/dashboard/constants";
import { aggregateAvailabilityCounts } from "@/lib/parking/availability";
import {
  loadActiveAssignments,
  loadActiveVisitsForAvailability,
  loadAllSpots,
} from "@/lib/parking/queries";
import { moneyToNumber } from "@/lib/finance/money";

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function startOfMonth(year: number, month: number) {
  return new Date(year, month - 1, 1);
}

export async function GET() {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const tenantWhere = mergeTenantWhere({}, auth.ctx);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const residentsWithPendingPayments = await prisma.resident.findMany({
      where: {
        ...tenantWhere,
        OR: [
          {
            payments: {
              some: { status: { in: ["pending", "overdue"] } },
            },
          },
          { paymentStatus: "pending" },
        ],
      },
      include: {
        payments: {
          where: { status: { in: ["pending", "overdue"] } },
          orderBy: { dueDate: "asc" },
        },
      },
    });

    const pendingPaymentsCount = residentsWithPendingPayments.length;
    const pendingPaymentsTotal = residentsWithPendingPayments.reduce((total, resident) => {
      if (resident.payments.length > 0) {
        return (
          total +
          resident.payments.reduce(
            (sum, payment) => sum + moneyToNumber(payment.amount),
            0
          )
        );
      }
      return total;
    }, 0);

    const totalResidents = await prisma.resident.count({ where: tenantWhere });
    const residentsAtMonthStart = await prisma.resident.count({
      where: { ...tenantWhere, createdAt: { lt: startOfMonth(currentYear, currentMonth) } },
    });
    const newResidentsThisMonth = totalResidents - residentsAtMonthStart;

    const residentsAtPrevMonthStart = await prisma.resident.count({
      where: { ...tenantWhere, createdAt: { lt: startOfMonth(previousYear, previousMonth) } },
    });
    const newResidentsPrevMonth =
      residentsAtMonthStart - residentsAtPrevMonthStart;
    const residentsTrend = percentChange(newResidentsThisMonth, newResidentsPrevMonth);

    const activeTokens = await prisma.token.count({
      where: { ...tenantWhere, status: "active" },
    });
    const tokensAtMonthStart = await prisma.token.count({
      where: {
        ...tenantWhere,
        status: "active",
        createdAt: { lt: startOfMonth(currentYear, currentMonth) },
      },
    });
    const newTokensThisMonth = activeTokens - tokensAtMonthStart;

    const tokensAtPrevMonthStart = await prisma.token.count({
      where: {
        ...tenantWhere,
        status: "active",
        createdAt: { lt: startOfMonth(previousYear, previousMonth) },
      },
    });
    const newTokensPrevMonth = tokensAtMonthStart - tokensAtPrevMonthStart;
    const tokensTrend = percentChange(newTokensThisMonth, newTokensPrevMonth);

    const currentMonthPayments = await prisma.payment.findMany({
      where: { ...tenantWhere, month: currentMonth, year: currentYear, status: "completed" },
    });
    const previousMonthPayments = await prisma.payment.findMany({
      where: { ...tenantWhere, month: previousMonth, year: previousYear, status: "completed" },
    });

    const currentMonthTotal = currentMonthPayments.reduce((sum, p) => sum + moneyToNumber(p.amount), 0);
    const previousMonthTotal = previousMonthPayments.reduce((sum, p) => sum + moneyToNumber(p.amount), 0);
    const percentageChange = percentChange(currentMonthTotal, previousMonthTotal);

    const prevMonthPending = await prisma.payment.count({
      where: {
        ...tenantWhere,
        month: previousMonth,
        year: previousYear,
        status: { in: ["pending", "overdue"] },
      },
    });
    const pendingPercentageChange = percentChange(pendingPaymentsCount, prevMonthPending);

    const paidResidents = await prisma.resident.count({
      where: { ...tenantWhere, paymentStatus: { in: ["paid", "completed"] } },
    });
    const occupancyRate =
      totalResidents === 0 ? 0 : Math.round((paidResidents / totalResidents) * 100);

    const monthlyGoal = Math.max(previousMonthTotal * 1.1, currentMonthTotal || 1);
    const monthlyGoalProgress = Math.min(
      100,
      Math.round((currentMonthTotal / monthlyGoal) * 100)
    );

    const recentActivities = await prisma.payment.findMany({
      take: 8,
      where: { ...tenantWhere, status: "completed" },
      include: {
        resident: {
          select: { name: true, lastName: true, noRegistro: true },
        },
      },
      orderBy: { paymentDate: "desc" },
    });

    const formattedActivities = recentActivities.map((payment) => ({
      id: payment.id,
      residentId: payment.residentId,
      residentName: payment.resident
        ? `${payment.resident.name} ${payment.resident.lastName}`
        : "—",
      noRegistro: payment.resident?.noRegistro ?? "",
      amount: moneyToNumber(payment.amount),
      paymentDate: payment.paymentDate.toISOString(),
    }));

    const pendingResidents = residentsWithPendingPayments.map((resident) => ({
      id: resident.id,
      name: `${resident.name} ${resident.lastName}`,
      cedula: resident.cedula,
      noRegistro: resident.noRegistro ?? "",
      amount:
        resident.payments.length > 0
          ? moneyToNumber(resident.payments[0].amount)
          : 0,
      dueDate:
        resident.payments.length > 0
          ? resident.payments[0].dueDate?.toISOString() ?? null
          : resident.nextPaymentDate?.toISOString() ?? null,
      status:
        resident.payments.length > 0 ? resident.payments[0].status : "pending",
    }));

    const yearPayments = await prisma.payment.findMany({
      where: { ...tenantWhere, year: currentYear },
      select: { month: true, amount: true, status: true },
    });

    const monthlyRevenue = MONTH_LABELS.map((label, index) => {
      const month = index + 1;
      const monthPayments = yearPayments.filter((p) => p.month === month);
      return {
        month: String(month),
        label,
        revenue: monthPayments
          .filter((p) => p.status === "completed")
          .reduce((s, p) => s + moneyToNumber(p.amount), 0),
        pending: monthPayments
          .filter((p) => p.status === "pending" || p.status === "overdue")
          .reduce((s, p) => s + moneyToNumber(p.amount), 0),
      };
    });

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const weekPayments = await prisma.payment.findMany({
      where: {
        ...tenantWhere,
        paymentDate: { gte: weekStart },
        status: "completed",
      },
      select: { paymentDate: true, amount: true },
    });

    const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dayPayments = weekPayments.filter((p) => {
        const d = new Date(p.paymentDate);
        return (
          d.getFullYear() === date.getFullYear() &&
          d.getMonth() === date.getMonth() &&
          d.getDate() === date.getDate()
        );
      });
      return {
        day: date.toISOString().slice(0, 10),
        label: DAY_LABELS[date.getDay()],
        payments: dayPayments.length,
        amount: dayPayments.reduce((s, p) => s + moneyToNumber(p.amount), 0),
      };
    });

    const [completedCount, pendingCount, overdueCount] = await Promise.all([
      prisma.payment.count({ where: { ...tenantWhere, status: "completed" } }),
      prisma.payment.count({ where: { ...tenantWhere, status: "pending" } }),
      prisma.payment.count({ where: { ...tenantWhere, status: "overdue" } }),
    ]);

    const paymentStatus = [
      { name: "Completados", value: completedCount, fill: DASHBOARD_COLORS.success },
      { name: "Pendientes", value: pendingCount, fill: DASHBOARD_COLORS.warning },
      { name: "Vencidos", value: overdueCount, fill: DASHBOARD_COLORS.danger },
    ].filter((s) => s.value > 0);

    const recentResidents = await prisma.resident.findMany({
      where: tenantWhere,
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        lastName: true,
        noRegistro: true,
        paymentStatus: true,
        createdAt: true,
      },
    });

    const last6Months = Array.from({ length: 6 }, (_, i) => {
      let m = currentMonth - 5 + i;
      let y = currentYear;
      while (m < 1) {
        m += 12;
        y -= 1;
      }
      while (m > 12) {
        m -= 12;
        y += 1;
      }
      return { month: m, year: y };
    });

    const buildSparkline = async (
      type: "residents" | "tokens" | "revenue" | "pending"
    ) => {
      return Promise.all(
        last6Months.map(async ({ month, year }) => {
          const end = startOfMonth(year, month === 12 ? 1 : month + 1);
          if (type === "residents") {
            const count = await prisma.resident.count({
              where: { ...tenantWhere, createdAt: { lt: end } },
            });
            return { value: count };
          }
          if (type === "tokens") {
            const count = await prisma.token.count({
              where: { ...tenantWhere, status: "active", createdAt: { lt: end } },
            });
            return { value: count };
          }
          if (type === "revenue") {
            const payments = await prisma.payment.findMany({
              where: { ...tenantWhere, month, year, status: "completed" },
              select: { amount: true },
            });
            return {
              value: payments.reduce((s, p) => s + moneyToNumber(p.amount), 0),
            };
          }
          const count = await prisma.payment.count({
            where: {
              ...tenantWhere,
              month,
              year,
              status: { in: ["pending", "overdue"] },
            },
          });
          return { value: count };
        })
      );
    };

    const [residentsSpark, tokensSpark, revenueSpark, pendingSpark] = await Promise.all([
      buildSparkline("residents"),
      buildSparkline("tokens"),
      buildSparkline("revenue"),
      buildSparkline("pending"),
    ]);

    const openStatuses = ["open", "assigned", "in_progress", "waiting"];
    const [spots, parkingAssignments, parkingVisits, pendingFinesCount] =
      await Promise.all([
        loadAllSpots(auth.ctx.tenantId, auth.ctx.propertyId),
        loadActiveAssignments(auth.ctx.tenantId),
        loadActiveVisitsForAvailability(auth.ctx.tenantId),
        prisma.parkingFine.count({
          where: { status: "pending", tenantId: auth.ctx.tenantId },
        }),
      ]);

    const parkingSpotCounts = aggregateAvailabilityCounts(
      spots,
      parkingAssignments.map((a) => ({ spotId: a.spotId, endDate: a.endDate })),
      parkingVisits
    );

    const [openCount, unassignedCount, slaBreachedCount, inProgressCount] =
      await Promise.all([
        prisma.maintenanceTicket.count({
          where: { ...tenantWhere, status: { in: openStatuses } },
        }),
        prisma.maintenanceTicket.count({
          where: {
            ...tenantWhere,
            status: { in: openStatuses },
            assignedToId: null,
          },
        }),
        prisma.maintenanceTicket.count({
          where: {
            ...tenantWhere,
            slaBreached: true,
            status: { notIn: ["closed", "cancelled", "resolved"] },
          },
        }),
        prisma.maintenanceTicket.count({
          where: { ...tenantWhere, status: "in_progress" },
        }),
      ]);

    return NextResponse.json({
      stats: {
        totalResidents,
        newResidentsThisMonth,
        residentsTrend,
        activeTokens,
        newTokensThisMonth,
        tokensTrend,
        currentMonthTotal,
        percentageChange,
        pendingPaymentsCount,
        pendingPaymentsTotal,
        pendingPercentageChange,
        occupancyRate,
        paidResidents,
        monthlyGoal,
        monthlyGoalProgress,
      },
      activities: formattedActivities,
      pendingResidents,
      monthlyRevenue,
      weeklyActivity,
      paymentStatus,
      recentResidents: recentResidents.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
      sparklines: {
        residents: residentsSpark,
        tokens: tokensSpark,
        revenue: revenueSpark,
        pending: pendingSpark,
      },
      ticketStats: {
        openCount,
        unassignedCount,
        slaBreachedCount,
        inProgressCount,
      },
      parkingStats: {
        available: parkingSpotCounts.available,
        occupied: parkingSpotCounts.occupied,
        total: parkingSpotCounts.total,
        pendingFines: pendingFinesCount,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Error al obtener las estadísticas" },
      { status: 500 }
    );
  }
}

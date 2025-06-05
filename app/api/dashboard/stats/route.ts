import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Obtener el mes y año actual
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Obtener residentes con pagos pendientes
    const residentsWithPendingPayments = await prisma.resident.findMany({
      where: {
        OR: [
          {
            payments: {
              some: {
                status: {
                  in: ["pending", "overdue"]
                }
              }
            }
          },
          {
            paymentStatus: "pending"
          }
        ]
      },
      include: {
        payments: {
          where: {
            status: {
              in: ["pending", "overdue"]
            }
          },
          orderBy: {
            dueDate: 'asc'
          }
        }
      }
    });

    // Calcular estadísticas
    const pendingPaymentsCount = residentsWithPendingPayments.length;
    const pendingPaymentsTotal = residentsWithPendingPayments.reduce((total, resident) => {
      // Si tiene pagos pendientes, sumar esos montos
      if (resident.payments.length > 0) {
        return total + resident.payments.reduce((sum, payment) => sum + payment.amount, 0);
      }
      // Si no tiene pagos pero está pendiente, sumar el monto estándar (700)
      return total + 700;
    }, 0);

    // Total de residentes
    const totalResidents = await prisma.resident.count();
    const previousMonthResidents = await prisma.resident.count({
      where: {
        createdAt: {
          lt: new Date(currentYear, currentMonth - 1, 1)
        }
      }
    });
    const newResidentsThisMonth = totalResidents - previousMonthResidents;

    // Tokens activos
    const activeTokens = await prisma.token.count({
      where: {
        status: "active"
      }
    });
    const previousMonthTokens = await prisma.token.count({
      where: {
        status: "active",
        createdAt: {
          lt: new Date(currentYear, currentMonth - 1, 1)
        }
      }
    });
    const newTokensThisMonth = activeTokens - previousMonthTokens;

    // Ingresos totales
    const currentMonthPayments = await prisma.payment.findMany({
      where: {
        month: currentMonth,
        year: currentYear,
        status: "completed"
      }
    });
    const previousMonthPayments = await prisma.payment.findMany({
      where: {
        month: previousMonth,
        year: previousYear,
        status: "completed"
      }
    });

    const currentMonthTotal = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0);
    const previousMonthTotal = previousMonthPayments.reduce((sum, p) => sum + p.amount, 0);
    const percentageChange = previousMonthTotal === 0 ? 100 : 
      ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100;

    // Actividades recientes
    const recentActivities = await prisma.payment.findMany({
      take: 5,
      where: {
        status: "completed"
      },
      include: {
        resident: {
          select: {
            name: true,
            lastName: true,
            noRegistro: true
          }
        }
      },
      orderBy: {
        paymentDate: 'desc'
      }
    });

    const formattedActivities = recentActivities.map(payment => ({
      id: payment.id,
      residentId: payment.residentId,
      residentName: `${payment.resident.name} ${payment.resident.lastName}`,
      noRegistro: payment.resident.noRegistro,
      amount: payment.amount,
      paymentDate: payment.paymentDate
    }));

    return NextResponse.json({
      stats: {
        totalResidents,
        newResidentsThisMonth,
        activeTokens,
        newTokensThisMonth,
        currentMonthTotal,
        percentageChange,
        pendingPaymentsCount,
        pendingPaymentsTotal,
        pendingResidents: residentsWithPendingPayments.map(resident => ({
          id: resident.id,
          name: `${resident.name} ${resident.lastName}`,
          cedula: resident.cedula,
          noRegistro: resident.noRegistro,
          amount: resident.payments.length > 0 ? resident.payments[0].amount : 700,
          dueDate: resident.payments.length > 0 ? resident.payments[0].dueDate : resident.nextPaymentDate,
          status: resident.payments.length > 0 ? resident.payments[0].status : "pending"
        }))
      },
      activities: formattedActivities
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: "Error al obtener las estadísticas" }, { status: 500 });
  }
} 
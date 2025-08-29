import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Obtener estadísticas básicas
    const totalPlans = await prisma.plan.count();
    const activePlans = await prisma.plan.count({ where: { status: 'active' } });
    const inactivePlans = await prisma.plan.count({ where: { status: 'inactive' } });
    const completedPlans = await prisma.plan.count({ where: { status: 'completed' } });

    // Obtener estadísticas por tipo de plan
    const plansByType = await prisma.plan.groupBy({
      by: ['planType'],
      _count: {
        planType: true,
      },
    });

    // Obtener estadísticas por estado
    const plansByStatus = await prisma.plan.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    // Obtener el valor total de todos los planes
    const totalValue = await prisma.plan.aggregate({
      _sum: {
        price: true,
      },
    });

    // Obtener planes recientes (últimos 5)
    const recentPlans = await prisma.plan.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        client: {
          select: {
            name: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      totalPlans,
      activePlans,
      inactivePlans,
      completedPlans,
      totalValue: totalValue._sum.price || 0,
      plansByType,
      plansByStatus,
      recentPlans,
    });
  } catch (error) {
    console.error('Error fetching plan stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas de planes' },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Obtener pagos recientes
    const recentPayments = await prisma.payment.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        resident: {
          select: {
            name: true,
            lastName: true
          }
        }
      }
    });

    // Obtener residentes recientes
    const recentResidents = await prisma.resident.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Obtener tokens recientes
    const recentTokens = await prisma.token.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        resident: {
          select: {
            name: true,
            lastName: true
          }
        }
      }
    });

    // Transformar los datos en actividades
    const activities = [
      ...recentPayments.map(payment => ({
        id: payment.id,
        type: 'payment' as const,
        title: 'Pago Registrado',
        description: `${payment.resident.name} ${payment.resident.lastName} realizó un pago de $${payment.amount}`,
        timestamp: payment.createdAt.toISOString(),
        status: 'success' as const
      })),
      ...recentResidents.map(resident => ({
        id: resident.id,
        type: 'resident' as const,
        title: 'Nuevo Residente',
        description: `${resident.name} ${resident.lastName} se registró como nuevo residente`,
        timestamp: resident.createdAt.toISOString(),
        status: 'info' as const
      })),
      ...recentTokens.map(token => ({
        id: token.id,
        type: 'token' as const,
        title: 'Token Generado',
        description: `Se generó un nuevo token para ${token.resident.name} ${token.resident.lastName}`,
        timestamp: token.createdAt.toISOString(),
        status: 'warning' as const
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10); // Limitar a las 10 actividades más recientes

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: "Error al obtener las actividades" },
      { status: 500 }
    );
  }
} 
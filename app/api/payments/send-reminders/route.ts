import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Obtener residentes con pagos pendientes
    const residents = await prisma.resident.findMany({
      where: {
        payments: {
          none: {
            paymentDate: {
              gte: firstDayOfMonth,
              lte: lastDayOfMonth
            }
          }
        }
      },
      include: {
        payments: true
      }
    });

    // Procesar cada residente
    for (const resident of residents) {
      // Aquí podrías implementar otras formas de notificación
      // como email o notificaciones en la aplicación
      console.log(`Recordatorio de pago pendiente para: ${resident.name}`);
    }

    return NextResponse.json({ 
      message: "Recordatorios procesados",
      count: residents.length
    });
  } catch (error) {
    console.error('Error al procesar recordatorios:', error);
    return NextResponse.json(
      { error: "Error al procesar recordatorios" },
      { status: 500 }
    );
  }
} 
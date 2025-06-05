import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { whatsappService } from "@/lib/whatsapp";

export async function GET() {
  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // Buscar residentes con pagos pendientes
    const residents = await prisma.resident.findMany({
      where: {
        paymentStatus: 'pending',
        nextPaymentDate: {
          gte: new Date(currentYear, currentMonth, 1),
          lte: new Date(currentYear, currentMonth, 30)
        }
      },
      include: {
        payments: {
          orderBy: {
            paymentDate: 'desc'
          },
          take: 1
        }
      }
    });

    // Enviar recordatorios por WhatsApp
    for (const resident of residents) {
      if (resident.phone) {
        try {
          await whatsappService.sendPaymentReminder(resident);
          console.log(`Recordatorio enviado a ${resident.name} ${resident.lastName}`);
        } catch (error) {
          console.error(`Error al enviar recordatorio a ${resident.name} ${resident.lastName}:`, error);
        }
      }
    }

    return NextResponse.json({
      message: "Recordatorios enviados",
      residentsNotified: residents.length
    });
  } catch (error) {
    console.error('Error al enviar recordatorios:', error);
    return NextResponse.json(
      { 
        error: "Error al enviar recordatorios",
        details: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
} 
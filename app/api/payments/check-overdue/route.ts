import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { whatsappService } from "@/lib/whatsapp";

export async function GET() {
  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();

    // Solo verificar si estamos después del día 5 del mes
    if (currentDay <= 5) {
      return NextResponse.json({ message: "No es necesario verificar pagos vencidos" });
    }

    // Buscar residentes con pagos pendientes
    const residents = await prisma.resident.findMany({
      where: {
        paymentStatus: 'pending',
        nextPaymentDate: {
          lt: new Date(currentYear, currentMonth, 5) // Fecha anterior al día 5 del mes actual
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

    // Actualizar estado de los residentes con pagos vencidos y enviar notificaciones
    for (const resident of residents) {
      // Actualizar estado
      await prisma.resident.update({
        where: { id: resident.id },
        data: {
          paymentStatus: 'late'
        }
      });

      // Enviar notificación por WhatsApp si tiene número de teléfono
      if (resident.phone) {
        try {
          await whatsappService.sendPaymentOverdue(resident);
          console.log(`Notificación enviada a ${resident.name} ${resident.lastName}`);
        } catch (error) {
          console.error(`Error al enviar notificación a ${resident.name} ${resident.lastName}:`, error);
        }
      }
    }

    return NextResponse.json({
      message: "Verificación de pagos vencidos completada",
      updatedResidents: residents.length
    });
  } catch (error) {
    console.error('Error al verificar pagos vencidos:', error);
    return NextResponse.json(
      { 
        error: "Error al verificar pagos vencidos",
        details: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
} 
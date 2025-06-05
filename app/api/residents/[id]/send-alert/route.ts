import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const resident = await prisma.resident.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 1
        }
      }
    });

    if (!resident) {
      return NextResponse.json({ error: "Residente no encontrado" }, { status: 404 });
    }

    // Formatear el número de teléfono (ajusta según tu país)
    const phone = resident.phone.replace(/\D/g, '');
    const waNumber = `1${phone}`; // Cambia el '1' por el código de país si no es México/USA

    // Obtener el último pago
    const lastPayment = resident.payments[0];
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    let message = '';
    if (!lastPayment || lastPayment.month < currentMonth || lastPayment.year < currentYear) {
      message = `Estimado ${resident.name} ${resident.lastName},\n\n` +
        `Le recordamos que su pago mensual está pendiente. ` +
        `Por favor, realice su pago antes del día 5 del mes actual.\n\n` +
        `Saludos cordiales,\n` +
        `Administración`;
    } else {
      message = `Estimado ${resident.name} ${resident.lastName},\n\n` +
        `Le informamos que su pago mensual está al día. ` +
        `Gracias por su puntualidad.\n\n` +
        `Saludos cordiales,\n` +
        `Administración`;
    }

    // Enviar mensaje por WhatsApp
    await sendWhatsAppMessage(waNumber, message);

    return NextResponse.json({ 
      success: true, 
      message: "Alerta enviada correctamente" 
    });
  } catch (error) {
    console.error('Error al enviar alerta:', error);
    return NextResponse.json(
      { error: "Error al enviar la alerta" }, 
      { status: 500 }
    );
  }
} 
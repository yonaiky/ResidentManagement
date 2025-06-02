import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sendWhatsappMessage, initializeWhatsappClient } from '@/src/whatsapp/whatsappClient';

// Asegurarse de que el cliente de WhatsApp se inicialice al cargar este endpoint
initializeWhatsappClient();

const prisma = new PrismaClient();

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const residentId = parseInt(params.id);

  try {
    const resident = await prisma.resident.findUnique({
      where: { id: residentId },
      select: {
        id: true,
        name: true,
        apellido: true,
        phone: true,
        whatsappConsent: true,
      },
    });

    if (!resident) {
      return NextResponse.json(
        { error: "Residente no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si el residente ha dado consentimiento para WhatsApp
    if (!resident.whatsappConsent) {
      return NextResponse.json(
        { error: "El residente no ha dado consentimiento para recibir mensajes por WhatsApp" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { message } = body;

    if (!message) {
         return NextResponse.json(
             { error: "Mensaje no proporcionado en el cuerpo de la solicitud" },
             { status: 400 }
         );
    }

    // --- Lógica para enviar el mensaje de WhatsApp usando whatsapp-web.js ---
    try {
        const sendResult = await sendWhatsappMessage(resident.phone, message);
        console.log("Resultado del envío:", sendResult);
         return NextResponse.json({ message: "Mensaje de WhatsApp enviado." });
    } catch (sendError: any) {
        console.error("Error al enviar mensaje con whatsapp-web.js:", sendError);
        return NextResponse.json(
            { error: `Error al enviar mensaje de WhatsApp: ${sendError.message}` },
            { status: 500 }
        );
    }
   // --- Fin de la lógica de envío --- //

  } catch (error) {
    console.error("Error en el endpoint de enviar WhatsApp:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud de mensaje de WhatsApp" },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService, DEFAULT_WHATSAPP_CONFIG } from '@/lib/whatsapp';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const userPayload = getUserFromRequest(request);
    
    if (!userPayload || !hasPermission(userPayload.role, 'manager')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { residentId, messageType, customMessage, amount, dueDate } = await request.json();

    if (!residentId) {
      return NextResponse.json(
        { error: 'Resident ID is required' },
        { status: 400 }
      );
    }

    // Obtener información del residente
    const resident = await prisma.resident.findUnique({
      where: { id: parseInt(residentId) }
    });

    if (!resident) {
      return NextResponse.json(
        { error: 'Resident not found' },
        { status: 404 }
      );
    }

    if (!resident.phone) {
      return NextResponse.json(
        { error: 'Resident does not have a phone number' },
        { status: 400 }
      );
    }

    // Inicializar servicio de WhatsApp
    const whatsappService = new WhatsAppService(DEFAULT_WHATSAPP_CONFIG);

    let message = '';
    const residentName = `${resident.name} ${resident.lastName}`;

    // Generar mensaje según el tipo
    switch (messageType) {
      case 'payment_reminder':
        if (!amount || !dueDate) {
          return NextResponse.json(
            { error: 'Amount and due date are required for payment reminders' },
            { status: 400 }
          );
        }
        message = WhatsAppService.generatePaymentReminderMessage(
          residentName,
          parseFloat(amount),
          new Date(dueDate)
        );
        break;

      case 'overdue_payment':
        if (!amount) {
          return NextResponse.json(
            { error: 'Amount is required for overdue payment notifications' },
            { status: 400 }
          );
        }
        const daysOverdue = dueDate ? 
          Math.floor((new Date().getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 
          0;
        message = WhatsAppService.generateOverduePaymentMessage(
          residentName,
          parseFloat(amount),
          daysOverdue
        );
        break;

      case 'payment_confirmation':
        if (!amount) {
          return NextResponse.json(
            { error: 'Amount is required for payment confirmations' },
            { status: 400 }
          );
        }
        const period = new Date().toLocaleDateString('es-DO', { month: 'long', year: 'numeric' });
        const receiptNumber = `REC-${Date.now()}`;
        message = WhatsAppService.generatePaymentConfirmationMessage(
          residentName,
          parseFloat(amount),
          period,
          receiptNumber
        );
        break;

      case 'welcome':
        message = WhatsAppService.generateWelcomeMessage(
          residentName,
          resident.noRegistro || 'N/A'
        );
        break;

      case 'custom':
        if (!customMessage) {
          return NextResponse.json(
            { error: 'Custom message is required' },
            { status: 400 }
          );
        }
        message = customMessage;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid message type' },
          { status: 400 }
        );
    }

    // Enviar mensaje
    const success = await whatsappService.sendTextMessage(resident.phone, message);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to send WhatsApp message' },
        { status: 500 }
      );
    }

    // Registrar la notificación en la base de datos
    await prisma.notification.create({
      data: {
        message: `WhatsApp enviado: ${messageType}`,
        type: 'whatsapp',
        residentId: resident.id,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'WhatsApp message sent successfully',
      recipient: residentName,
      phone: resident.phone
    });

  } catch (error) {
    console.error('WhatsApp send error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
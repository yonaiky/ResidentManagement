import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService, DEFAULT_WHATSAPP_CONFIG } from '@/lib/whatsapp';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const userPayload = getUserFromRequest(request);
    
    if (!userPayload || !hasPermission(userPayload.role, 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { messageType, customMessage, filters } = await request.json();

    if (!messageType) {
      return NextResponse.json(
        { error: 'Message type is required' },
        { status: 400 }
      );
    }

    // Construir filtros para obtener residentes
    let whereClause: any = {
      phone: {
        not: null,
        not: ''
      }
    };

    if (filters) {
      if (filters.paymentStatus) {
        whereClause.paymentStatus = filters.paymentStatus;
      }
      if (filters.hasTokens !== undefined) {
        if (filters.hasTokens) {
          whereClause.tokens = {
            some: {}
          };
        } else {
          whereClause.tokens = {
            none: {}
          };
        }
      }
    }

    // Obtener residentes que cumplen los criterios
    const residents = await prisma.resident.findMany({
      where: whereClause,
      include: {
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 1
        }
      }
    });

    if (residents.length === 0) {
      return NextResponse.json(
        { error: 'No residents found matching the criteria' },
        { status: 404 }
      );
    }

    // Inicializar servicio de WhatsApp
    const whatsappService = new WhatsAppService(DEFAULT_WHATSAPP_CONFIG);

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Enviar mensajes con delay para evitar rate limiting
    for (let i = 0; i < residents.length; i++) {
      const resident = residents[i];
      const residentName = `${resident.name} ${resident.lastName}`;
      
      try {
        let message = '';

        // Generar mensaje según el tipo
        switch (messageType) {
          case 'payment_reminder':
            const amount = 700; // Monto estándar
            const dueDate = resident.nextPaymentDate || new Date();
            message = WhatsAppService.generatePaymentReminderMessage(
              residentName,
              amount,
              dueDate
            );
            break;

          case 'overdue_payment':
            const overdueAmount = 700;
            const lastPayment = resident.payments[0];
            const daysOverdue = lastPayment ? 
              Math.floor((new Date().getTime() - new Date(lastPayment.paymentDate).getTime()) / (1000 * 60 * 60 * 24)) : 
              30;
            message = WhatsAppService.generateOverduePaymentMessage(
              residentName,
              overdueAmount,
              daysOverdue
            );
            break;

          case 'maintenance_notification':
            const maintenanceDate = new Date();
            maintenanceDate.setDate(maintenanceDate.getDate() + 7); // Una semana desde hoy
            message = WhatsAppService.generateMaintenanceNotificationMessage(
              'Mantenimiento Programado',
              'Se realizará mantenimiento preventivo en las áreas comunes del residencial.',
              maintenanceDate
            );
            break;

          case 'custom':
            if (!customMessage) {
              throw new Error('Custom message is required');
            }
            message = customMessage.replace('{name}', residentName);
            break;

          default:
            throw new Error('Invalid message type');
        }

        // Enviar mensaje
        const success = await whatsappService.sendTextMessage(resident.phone, message);

        if (success) {
          successCount++;
          
          // Registrar notificación
          await prisma.notification.create({
            data: {
              message: `WhatsApp masivo enviado: ${messageType}`,
              type: 'whatsapp',
              residentId: resident.id,
            }
          });

          results.push({
            residentId: resident.id,
            name: residentName,
            phone: resident.phone,
            status: 'sent'
          });
        } else {
          failureCount++;
          results.push({
            residentId: resident.id,
            name: residentName,
            phone: resident.phone,
            status: 'failed'
          });
        }

        // Delay de 2 segundos entre mensajes para evitar rate limiting
        if (i < residents.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        failureCount++;
        results.push({
          residentId: resident.id,
          name: residentName,
          phone: resident.phone,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Bulk WhatsApp sending completed',
      summary: {
        total: residents.length,
        successful: successCount,
        failed: failureCount
      },
      results
    });

  } catch (error) {
    console.error('Bulk WhatsApp send error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
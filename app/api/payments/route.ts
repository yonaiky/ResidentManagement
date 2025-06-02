import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET all payments
export async function GET() {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        resident: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(payments);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener los pagos' }, { status: 500 });
  }
}

// POST new payment
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, residentId, month, year } = body;

    // Obtener la fecha actual
    const now = new Date();
    const currentMonth = month || now.getMonth() + 1;
    const currentYear = year || now.getFullYear();

    // Calcular la fecha de vencimiento (5 días después del 30 del mes)
    const dueDate = new Date(currentYear, currentMonth - 1, 30);
    dueDate.setDate(dueDate.getDate() + 5);

    // Crear el pago
    const payment = await prisma.payment.create({
      data: {
        amount: parseFloat(amount),
        residentId: parseInt(residentId),
        month: parseInt(currentMonth),
        year: parseInt(currentYear),
        paymentDate: now,
        status: 'paid',
        dueDate,
      },
      include: {
        resident: true,
      },
    });

    // Actualizar el estado de los tokens del residente
    await prisma.token.updateMany({
      where: {
        residentId: parseInt(residentId),
      },
      data: {
        status: 'active',
        paymentStatus: 'paid',
        lastPaymentDate: now,
        nextPaymentDate: dueDate,
      },
    });

    // Actualizar el estado del residente
    await prisma.resident.update({
      where: {
        id: parseInt(residentId),
      },
      data: {
        paymentStatus: 'paid',
        lastPaymentDate: now,
        nextPaymentDate: dueDate,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Error al registrar el pago' }, { status: 500 });
  }
}

// PUT update payment
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, amount, status, paymentDate, dueDate } = body;

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        amount,
        status,
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    return NextResponse.json(payment);
  } catch (error) {
    return NextResponse.json({ error: 'Error updating payment' }, { status: 500 });
  }
}

// DELETE payment
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.payment.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting payment' }, { status: 500 });
  }
}

// Función para generar pagos automáticos (se ejecutará el día 30 de cada mes)
export async function generateMonthlyPayments() {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Obtener todos los residentes activos
    const residents = await prisma.resident.findMany();

    for (const resident of residents) {
      // Calcular la fecha de vencimiento (5 días después del 30 del mes)
      const dueDate = new Date(currentYear, currentMonth - 1, 30);
      dueDate.setDate(dueDate.getDate() + 5);

      // Crear el pago automático
      await prisma.payment.create({
        data: {
          amount: 1000, // Monto fijo mensual
          residentId: resident.id,
          month: currentMonth,
          year: currentYear,
          dueDate,
          status: 'pending',
        },
      });

      // Actualizar el estado de los tokens
      await prisma.token.updateMany({
        where: {
          residentId: resident.id,
        },
        data: {
          paymentStatus: 'pending',
          dueDate,
        },
      });

      // Actualizar el estado del residente
      await prisma.resident.update({
        where: {
          id: resident.id,
        },
        data: {
          paymentStatus: 'pending',
          nextPaymentDate: dueDate,
        },
      });
    }

    return NextResponse.json({ message: 'Monthly payments generated successfully' });
  } catch (error) {
    console.error('Error generating monthly payments:', error);
    return NextResponse.json({ error: 'Error generating monthly payments' }, { status: 500 });
  }
}

// Función para verificar pagos vencidos (se ejecutará diariamente)
export async function checkOverduePayments() {
  try {
    const now = new Date();

    // Buscar pagos vencidos
    const overduePayments = await prisma.payment.findMany({
      where: {
        status: 'pending',
        dueDate: {
          lt: now,
        },
      },
      include: {
        resident: true,
      },
    });

    for (const payment of overduePayments) {
      // Actualizar el estado de los tokens a inactivo
      await prisma.token.updateMany({
        where: {
          residentId: payment.residentId,
        },
        data: {
          status: 'inactive',
          paymentStatus: 'overdue',
        },
      });

      // Actualizar el estado del pago
      await prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: 'overdue',
        },
      });

      // Actualizar el estado del residente
      await prisma.resident.update({
        where: {
          id: payment.residentId,
        },
        data: {
          paymentStatus: 'overdue',
        },
      });

      // Crear notificación para el residente
      await prisma.notification.create({
        data: {
          message: 'Tus tokens han sido desactivados por falta de pago',
          type: 'warning',
          residentId: payment.residentId,
        },
      });
    }

    return NextResponse.json({ message: 'Overdue payments checked successfully' });
  } catch (error) {
    console.error('Error checking overdue payments:', error);
    return NextResponse.json({ error: 'Error checking overdue payments' }, { status: 500 });
  }
} 
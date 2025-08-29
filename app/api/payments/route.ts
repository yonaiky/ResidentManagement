import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

// GET all payments
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    const where = clientId ? { clientId: parseInt(clientId) } : {};

    const payments = await prisma.payment.findMany({
      where,
      include: {
        client: {
          select: {
            name: true,
            lastName: true,
            cedula: true
          }
        },
        plan: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });

    // Transformar los datos para incluir información adicional
    const formattedPayments = payments.map(payment => ({
      ...payment,
      clientName: payment.client ? `${payment.client.name} ${payment.client.lastName}` : 'Cliente no encontrado',
      cedula: payment.client?.cedula || 'N/A',
    }));

    return NextResponse.json(formattedPayments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching payments',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// POST new payment
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, residentId, paymentDate, month, year } = body;

    if (!amount || !residentId || !paymentDate || !month || !year) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.create({
      data: {
        amount: parseFloat(amount),
        residentId: parseInt(residentId),
        paymentDate: new Date(paymentDate),
        month: parseInt(month),
        year: parseInt(year),
        dueDate: new Date(year, month - 1, 30), // Fecha de vencimiento al final del mes
      },
      include: {
        resident: true,
      },
    });

    // Actualizar el estado de pago del residente
    await prisma.resident.update({
      where: { id: parseInt(residentId) },
      data: {
        paymentStatus: 'paid',
        nextPaymentDate: new Date(year, month, 30), // Próximo pago al final del mes siguiente
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { 
        error: 'Error creating payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// PUT update payment
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, amount, status, paymentDate, dueDate } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.update({
      where: { id: parseInt(id) },
      data: {
        amount: amount ? parseFloat(amount) : undefined,
        status,
        paymentDate: paymentDate ? new Date(paymentDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      },
      include: {
        resident: true,
      },
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { 
        error: 'Error updating payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
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
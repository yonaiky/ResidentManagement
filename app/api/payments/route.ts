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
    });
    return NextResponse.json(payments);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching payments' }, { status: 500 });
  }
}

// POST new payment
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, residentId, dueDate } = body;

    const payment = await prisma.payment.create({
      data: {
        amount,
        residentId,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error creating payment' }, { status: 500 });
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
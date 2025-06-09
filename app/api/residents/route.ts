import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Obtener todos los residentes
export async function GET() {
  try {
    const residents = await prisma.resident.findMany({
      include: {
        tokens: true,
        payments: true,
        notifications: true,
      },
    });

    // Actualizar el estado de pago de los residentes
    const today = new Date();
    for (const resident of residents) {
      if (resident.nextPaymentDate && new Date(resident.nextPaymentDate) < today && resident.paymentStatus === 'pending') {
        await prisma.resident.update({
          where: { id: resident.id },
          data: { paymentStatus: 'overdue' },
        });
      }
    }

    return NextResponse.json(residents);
  } catch (error) {
    console.error('Error fetching residents:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching residents',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// POST new resident
export async function POST(request: Request) {
  try {
    const { name, lastName, cedula, noRegistro, phone, address } = await request.json();

    const today = new Date();
    const nextPaymentDate = new Date(today.getFullYear(), today.getMonth(), 30);

    const resident = await prisma.resident.create({
      data: {
        name,
        lastName,
        cedula,
        noRegistro,
        phone,
        address,
        paymentStatus: 'pending',
        nextPaymentDate,
      },
    });

    return NextResponse.json(resident, { status: 201 });
  } catch (error) {
    console.error('Error creating resident:', error);
    return NextResponse.json(
      { 
        error: 'Error creating resident',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// PUT update resident
export async function PUT(request: Request) {
  try {
    const { id, name, lastName, cedula, noRegistro, phone, address } = await request.json();

    const today = new Date();
    const nextPaymentDate = new Date(today.getFullYear(), today.getMonth(), 30);

    const resident = await prisma.resident.update({
      where: { id },
      data: {
        name,
        lastName,
        cedula,
        noRegistro,
        phone,
        address,
        paymentStatus: 'pending',
        nextPaymentDate,
      },
    });

    return NextResponse.json(resident);
  } catch (error) {
    console.error('Error updating resident:', error);
    return NextResponse.json(
      { 
        error: 'Error updating resident',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// DELETE resident
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.resident.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Resident deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting resident' }, { status: 500 });
  }
}
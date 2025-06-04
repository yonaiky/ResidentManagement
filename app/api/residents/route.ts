import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

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
    const body = await request.json();
    const { name, lastName, cedula, phone, address } = body;

    const resident = await prisma.resident.create({
      data: {
        name,
        lastName,
        cedula,
        phone,
        address,
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
    const body = await request.json();
    const { id, name, lastName, cedula, phone, address, paymentStatus } = body;

    const resident = await prisma.resident.update({
      where: { id },
      data: {
        name,
        lastName,
        cedula,
        phone,
        address,
        paymentStatus,
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
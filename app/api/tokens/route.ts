import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// GET all tokens
export async function GET() {
  try {
    const tokens = await prisma.token.findMany({
      include: {
        resident: true,
      },
    });
    return NextResponse.json(tokens);
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching tokens',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// POST new token
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, residentId } = body;

    if (!name || !residentId) {
      return NextResponse.json(
        { error: 'Name and residentId are required' },
        { status: 400 }
      );
    }

    const token = await prisma.token.create({
      data: {
        name,
        residentId: parseInt(residentId),
      },
      include: {
        resident: true,
      },
    });

    return NextResponse.json(token, { status: 201 });
  } catch (error) {
    console.error('Error creating token:', error);
    return NextResponse.json(
      { 
        error: 'Error creating token',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// PUT update token
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, status, paymentStatus } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const token = await prisma.token.update({
      where: { id: parseInt(id) },
      data: {
        name,
        status,
        paymentStatus,
      },
      include: {
        resident: true,
      },
    });

    return NextResponse.json(token);
  } catch (error) {
    console.error('Error updating token:', error);
    return NextResponse.json(
      { 
        error: 'Error updating token',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// DELETE token
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    await prisma.token.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Token deleted successfully' });
  } catch (error) {
    console.error('Error deleting token:', error);
    return NextResponse.json(
      { 
        error: 'Error deleting token',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 
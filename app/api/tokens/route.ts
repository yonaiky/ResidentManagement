import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    return NextResponse.json({ error: 'Error fetching tokens' }, { status: 500 });
  }
}

// POST new token
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, residentId } = body;

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
    return NextResponse.json({ error: 'Error creating token' }, { status: 500 });
  }
}

// PUT update token
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, status, paymentStatus } = body;

    const token = await prisma.token.update({
      where: { id },
      data: {
        name,
        status,
        paymentStatus,
      },
    });

    return NextResponse.json(token);
  } catch (error) {
    return NextResponse.json({ error: 'Error updating token' }, { status: 500 });
  }
}

// DELETE token
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.token.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Token deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting token' }, { status: 500 });
  }
} 
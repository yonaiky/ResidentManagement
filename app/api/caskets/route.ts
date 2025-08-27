import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const caskets = await prisma.casket.findMany({
      include: {
        plans: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(caskets);
  } catch (error) {
    console.error('Error fetching caskets:', error);
    return NextResponse.json(
      { error: 'Error al obtener los ataúdes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, material, size, price, stock } = body;

    // Validar campos requeridos
    if (!name || !material || !price || stock === undefined) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const casket = await prisma.casket.create({
      data: {
        name,
        description: description || null,
        material,
        size: size || null,
        price: parseFloat(price),
        stock: parseInt(stock),
      },
    });

    return NextResponse.json(casket, { status: 201 });
  } catch (error) {
    console.error('Error creating casket:', error);
    return NextResponse.json(
      { error: 'Error al crear el ataúd' },
      { status: 500 }
    );
  }
}

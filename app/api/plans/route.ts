import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      include: {
        client: true,
        casket: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Error al obtener los planes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, planType, price, duration, clientId, casketId } = body;

    // Validar campos requeridos
    if (!name || !planType || !price || !clientId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el cliente existe
    const client = await prisma.client.findUnique({
      where: { id: parseInt(clientId) },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si el ataúd existe (si se proporciona)
    if (casketId) {
      const casket = await prisma.casket.findUnique({
        where: { id: parseInt(casketId) },
      });

      if (!casket) {
        return NextResponse.json(
          { error: 'Ataúd no encontrado' },
          { status: 404 }
        );
      }
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        description: description || null,
        planType,
        price: parseFloat(price),
        duration: duration ? parseInt(duration) : null,
        clientId: parseInt(clientId),
        casketId: casketId ? parseInt(casketId) : null,
      },
      include: {
        client: true,
        casket: true,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json(
      { error: 'Error al crear el plan' },
      { status: 500 }
    );
  }
}

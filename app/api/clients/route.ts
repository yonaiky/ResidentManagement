import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      include: {
        plans: true,
        payments: true,
        notifications: true,
        familyMembers: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Error al obtener los clientes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, lastName, cedula, phone, email, address, emergencyContact, emergencyPhone } = body;

    // Validar campos requeridos
    if (!name || !lastName || !cedula || !phone || !address) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Verificar si la cédula ya existe
    const existingClient = await prisma.client.findUnique({
      where: { cedula },
    });

    if (existingClient) {
      return NextResponse.json(
        { error: 'Ya existe un cliente con esta cédula' },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: {
        name,
        lastName,
        cedula,
        phone,
        email: email || null,
        address,
        emergencyContact: emergencyContact || null,
        emergencyPhone: emergencyPhone || null,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Error al crear el cliente' },
      { status: 500 }
    );
  }
}

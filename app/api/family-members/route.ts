import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const familyMembers = await prisma.familyMember.findMany({
      include: {
        client: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(familyMembers);
  } catch (error) {
    console.error('Error fetching family members:', error);
    return NextResponse.json(
      { error: 'Error al obtener los familiares' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, lastName, cedula, phone, email, relationship, dateOfBirth, clientId } = body;

    // Validar campos requeridos
    if (!name || !lastName || !cedula || !relationship || !clientId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Verificar si la cédula ya existe
    const existingFamilyMember = await prisma.familyMember.findUnique({
      where: { cedula },
    });

    if (existingFamilyMember) {
      return NextResponse.json(
        { error: 'Ya existe un familiar con esta cédula' },
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

    const familyMember = await prisma.familyMember.create({
      data: {
        name,
        lastName,
        cedula,
        phone: phone || null,
        email: email || null,
        relationship,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        clientId: parseInt(clientId),
      },
      include: {
        client: true,
      },
    });

    return NextResponse.json(familyMember, { status: 201 });
  } catch (error) {
    console.error('Error creating family member:', error);
    return NextResponse.json(
      { error: 'Error al crear el familiar' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    const familyMember = await prisma.familyMember.findUnique({
      where: { id },
      include: {
        client: true,
      },
    });

    if (!familyMember) {
      return NextResponse.json(
        { error: 'Familiar no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(familyMember);
  } catch (error) {
    console.error('Error fetching family member:', error);
    return NextResponse.json(
      { error: 'Error al obtener el familiar' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, lastName, cedula, phone, email, relationship, dateOfBirth, clientId } = body;

    // Validar campos requeridos
    if (!name || !lastName || !cedula || !relationship || !clientId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Verificar si la cédula ya existe en otro familiar
    const existingFamilyMember = await prisma.familyMember.findFirst({
      where: {
        cedula,
        id: { not: id },
      },
    });

    if (existingFamilyMember) {
      return NextResponse.json(
        { error: 'Ya existe otro familiar con esta cédula' },
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

    const familyMember = await prisma.familyMember.update({
      where: { id },
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

    return NextResponse.json(familyMember);
  } catch (error) {
    console.error('Error updating family member:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el familiar' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Verificar si el familiar existe
    const familyMember = await prisma.familyMember.findUnique({
      where: { id },
    });

    if (!familyMember) {
      return NextResponse.json(
        { error: 'Familiar no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar el familiar
    await prisma.familyMember.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Familiar eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting family member:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el familiar' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const planType = searchParams.get('planType') || '';
    const clientId = searchParams.get('clientId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
        { client: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (planType) {
      where.planType = planType;
    }

    if (clientId) {
      where.clientId = parseInt(clientId);
    }

    // Obtener planes con filtros
    const plans = await prisma.plan.findMany({
      where,
      include: {
        client: true,
        casket: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Obtener el total de planes para paginación
    const total = await prisma.plan.count({ where });

    return NextResponse.json({
      plans,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
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
        { error: 'Faltan campos requeridos: name, planType, price, clientId' },
        { status: 400 }
      );
    }

    // Validar tipos de datos
    if (typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'El nombre del plan es requerido' },
        { status: 400 }
      );
    }

    if (typeof price !== 'number' && isNaN(parseFloat(price))) {
      return NextResponse.json(
        { error: 'El precio debe ser un número válido' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(clientId))) {
      return NextResponse.json(
        { error: 'El ID del cliente debe ser un número válido' },
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
      if (isNaN(parseInt(casketId))) {
        return NextResponse.json(
          { error: 'El ID del ataúd debe ser un número válido' },
          { status: 400 }
        );
      }

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

    // Validar que el precio sea positivo
    const parsedPrice = parseFloat(price);
    if (parsedPrice <= 0) {
      return NextResponse.json(
        { error: 'El precio debe ser mayor a 0' },
        { status: 400 }
      );
    }

    const plan = await prisma.plan.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        planType,
        price: parsedPrice,
        duration: duration ? parseInt(duration) : null,
        clientId: parseInt(clientId),
        casketId: casketId ? parseInt(casketId) : null,
        status: 'active', // Estado por defecto
      },
      include: {
        client: true,
        casket: true,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error('Error creating plan:', error);
    
    // Manejar errores específicos de Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un plan con ese nombre para este cliente' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al crear el plan' },
      { status: 500 }
    );
  }
}

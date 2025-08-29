import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const planId = parseInt(params.id);
    
    if (isNaN(planId)) {
      return NextResponse.json(
        { error: 'ID de plan inválido' },
        { status: 400 }
      );
    }

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: {
        client: true,
        casket: true,
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error fetching plan:', error);
    return NextResponse.json(
      { error: 'Error al obtener el plan' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const planId = parseInt(params.id);
    
    if (isNaN(planId)) {
      return NextResponse.json(
        { error: 'ID de plan inválido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, planType, price, duration, clientId, casketId, status } = body;

    // Verificar si el plan existe
    const existingPlan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si el cliente existe (si se proporciona)
    if (clientId) {
      const client = await prisma.client.findUnique({
        where: { id: parseInt(clientId) },
      });

      if (!client) {
        return NextResponse.json(
          { error: 'Cliente no encontrado' },
          { status: 404 }
        );
      }
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

    const updatedPlan = await prisma.plan.update({
      where: { id: planId },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        planType: planType || undefined,
        price: price ? parseFloat(price) : undefined,
        duration: duration ? parseInt(duration) : undefined,
        clientId: clientId ? parseInt(clientId) : undefined,
        casketId: casketId ? parseInt(casketId) : undefined,
        status: status || undefined,
      },
      include: {
        client: true,
        casket: true,
      },
    });

    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el plan' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const planId = parseInt(params.id);
    
    if (isNaN(planId)) {
      return NextResponse.json(
        { error: 'ID de plan inválido' },
        { status: 400 }
      );
    }

    // Verificar si el plan existe
    const existingPlan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar el plan
    await prisma.plan.delete({
      where: { id: planId },
    });

    return NextResponse.json(
      { message: 'Plan eliminado exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el plan' },
      { status: 500 }
    );
  }
}

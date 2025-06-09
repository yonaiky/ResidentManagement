import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { message } = await request.json();
    const residentId = parseInt(params.id);

    // Verificar que el residente existe
    const resident = await prisma.resident.findUnique({
      where: { id: residentId }
    });

    if (!resident) {
      return NextResponse.json(
        { error: "Residente no encontrado" },
        { status: 404 }
      );
    }

    // Aquí podrías implementar otras formas de notificación
    // como email o notificaciones en la aplicación
    console.log(`Alerta para ${resident.name}: ${message}`);

    return NextResponse.json({ 
      message: "Alerta procesada",
      resident: {
        id: resident.id,
        name: resident.name
      }
    });
  } catch (error) {
    console.error('Error al procesar la alerta:', error);
    return NextResponse.json(
      { error: "Error al procesar la alerta" },
      { status: 500 }
    );
  }
} 
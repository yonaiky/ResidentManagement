import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const resident = await prisma.resident.findUnique({
      where: {
        id: parseInt(params.id),
      },
      include: {
        tokens: true,
        payments: true,
        notifications: true,
      },
    });

    if (!resident) {
      return NextResponse.json(
        { error: "Residente no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(resident);
  } catch (error) {
    console.error("Error fetching resident:", error);
    return NextResponse.json(
      { error: "Error al obtener el residente" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const resident = await prisma.resident.delete({
      where: {
        id: parseInt(params.id),
      },
    });

    return NextResponse.json({ message: "Residente eliminado exitosamente" });
  } catch (error) {
    console.error("Error deleting resident:", error);
    return NextResponse.json(
      { error: "Error al eliminar el residente" },
      { status: 500 }
    );
  }
} 
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET token by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = await prisma.token.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        resident: true,
      },
    });

    if (!token) {
      return NextResponse.json(
        { error: "Token not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(token);
  } catch (error) {
    console.error('Error fetching token:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching token',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, status } = body;

    const token = await prisma.token.update({
      where: { id: parseInt(params.id) },
      data: {
        name,
        status,
      },
    });

    return NextResponse.json(token);
  } catch (error) {
    return NextResponse.json(
      { error: "Error updating token" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const tokenId = parseInt(params.id);

    // Verificar si el token existe
    const token = await prisma.token.findUnique({
      where: { id: tokenId }
    });

    if (!token) {
      return NextResponse.json(
        { error: "Token no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar el token
    await prisma.token.delete({
      where: { id: tokenId }
    });

    return NextResponse.json({ message: "Token eliminado exitosamente" });
  } catch (error) {
    console.error('Error deleting token:', error);
    return NextResponse.json(
      { error: "Error al eliminar el token" },
      { status: 500 }
    );
  }
}
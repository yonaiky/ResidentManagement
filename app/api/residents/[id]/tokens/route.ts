import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const tokens = await prisma.token.findMany({
      where: {
        residentId: parseInt(params.id),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(tokens);
  } catch (error) {
    console.error("Error fetching resident tokens:", error);
    return NextResponse.json(
      { error: "Error al obtener los tokens del residente" },
      { status: 500 }
    );
  }
} 
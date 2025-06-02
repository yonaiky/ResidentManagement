import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const payments = await prisma.payment.findMany({
      where: {
        residentId: parseInt(params.id),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching resident payments:", error);
    return NextResponse.json(
      { error: "Error al obtener los pagos del residente" },
      { status: 500 }
    );
  }
} 
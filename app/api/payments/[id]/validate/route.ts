import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const paymentId = parseInt(params.id);
    const now = new Date();

    // Obtener el pago
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { resident: true },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Pago no encontrado" },
        { status: 404 }
      );
    }

    // Actualizar el pago
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "paid",
        paymentDate: now,
      },
    });

    // Actualizar el estado de los tokens
    await prisma.token.updateMany({
      where: {
        residentId: payment.residentId,
      },
      data: {
        status: "active",
        paymentStatus: "paid",
        lastPaymentDate: now,
        nextPaymentDate: new Date(now.getFullYear(), now.getMonth() + 1, 30),
      },
    });

    // Actualizar el estado del residente
    await prisma.resident.update({
      where: {
        id: payment.residentId,
      },
      data: {
        paymentStatus: "paid",
        lastPaymentDate: now,
        nextPaymentDate: new Date(now.getFullYear(), now.getMonth() + 1, 30),
      },
    });

    return NextResponse.json(updatedPayment);
  } catch (error) {
    console.error("Error validating payment:", error);
    return NextResponse.json(
      { error: "Error al validar el pago" },
      { status: 500 }
    );
  }
} 
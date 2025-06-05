import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const payments = await prisma.payment.findMany({
      take: 10, // Limitar a los 10 pagos más recientes
      where: {
        status: "completed"
      },
      include: {
        resident: {
          select: {
            name: true,
            lastName: true,
            cedula: true,
            noRegistro: true
          }
        }
      },
      orderBy: {
        paymentDate: 'desc'
      }
    });

    // Transformar los datos para incluir información adicional
    const formattedPayments = payments.map(payment => ({
      ...payment,
      residentName: `${payment.resident.name} ${payment.resident.lastName}`,
      cedula: payment.resident.cedula,
      noRegistro: payment.resident.noRegistro,
      monthName: new Date(payment.year, payment.month - 1).toLocaleString('es', { month: 'long' }),
      year: payment.year
    }));

    return NextResponse.json(formattedPayments);
  } catch (error) {
    console.error('Error fetching recent payments:', error);
    return NextResponse.json({ error: "Error al obtener los pagos recientes" }, { status: 500 });
  }
} 
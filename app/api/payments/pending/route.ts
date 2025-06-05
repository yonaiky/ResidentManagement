import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const payments = await prisma.payment.findMany({
      where: {
        status: {
          in: ["pending", "overdue"]
        }
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
        dueDate: 'asc'
      }
    });

    // Transformar los datos para incluir información adicional
    const formattedPayments = payments.map(payment => ({
      ...payment,
      residentName: `${payment.resident.name} ${payment.resident.lastName}`,
      cedula: payment.resident.cedula,
      noRegistro: payment.resident.noRegistro
    }));

    return NextResponse.json(formattedPayments);
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    return NextResponse.json({ error: "Error al obtener los pagos pendientes" }, { status: 500 });
  }
} 
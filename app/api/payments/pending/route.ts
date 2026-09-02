import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAuth } from "@/lib/tenant/auth";
import { mergeTenantWhere } from "@/lib/tenant/scope";
import { moneyToNumber } from "@/lib/finance/money";

export async function GET() {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const payments = await prisma.payment.findMany({
      where: mergeTenantWhere(
        { status: { in: ["pending", "overdue", "PARTIAL"] } },
        auth.ctx
      ),
      include: {
        resident: {
          select: {
            name: true,
            lastName: true,
            cedula: true,
            noRegistro: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    const formattedPayments = payments.map((payment) => ({
      ...payment,
      amount: moneyToNumber(payment.amount),
      residentName: payment.resident
        ? `${payment.resident.name} ${payment.resident.lastName}`
        : "—",
      cedula: payment.resident?.cedula ?? "",
      noRegistro: payment.resident?.noRegistro ?? "",
    }));

    return NextResponse.json(formattedPayments);
  } catch (error) {
    console.error("Error fetching pending payments:", error);
    return NextResponse.json(
      { error: "Error al obtener los pagos pendientes" },
      { status: 500 }
    );
  }
}

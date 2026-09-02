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
        { status: { in: ["completed", "CONFIRMED"] } },
        auth.ctx
      ),
      take: 10,
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
      orderBy: { paymentDate: "desc" },
    });

    const formattedPayments = payments.map((payment) => ({
      ...payment,
      amount: moneyToNumber(payment.amount),
      residentName: payment.resident
        ? `${payment.resident.name} ${payment.resident.lastName}`
        : "—",
      cedula: payment.resident?.cedula ?? "",
      noRegistro: payment.resident?.noRegistro ?? "",
      monthName:
        payment.month && payment.year
          ? new Date(payment.year, payment.month - 1).toLocaleString("es", {
              month: "long",
            })
          : "",
      year: payment.year,
    }));

    return NextResponse.json(formattedPayments);
  } catch (error) {
    console.error("Error fetching recent payments:", error);
    return NextResponse.json(
      { error: "Error al obtener los pagos recientes" },
      { status: 500 }
    );
  }
}

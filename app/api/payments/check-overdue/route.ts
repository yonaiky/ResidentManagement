import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantManager } from "@/lib/tenant/auth";
import { mergeTenantWhere } from "@/lib/tenant/scope";

export async function POST() {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;

  try {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const residents = await prisma.resident.findMany({
      where: mergeTenantWhere(
        {
          payments: {
            none: {
              paymentDate: {
                gte: firstDayOfMonth,
                lte: lastDayOfMonth,
              },
            },
          },
        },
        auth.ctx
      ),
      include: { payments: true },
    });

    for (const resident of residents) {
      console.log(`Pago vencido para: ${resident.name}`);
    }

    return NextResponse.json({
      message: "Verificación de pagos vencidos completada",
      count: residents.length,
    });
  } catch (error) {
    console.error("Error al verificar pagos vencidos:", error);
    return NextResponse.json(
      { error: "Error al verificar pagos vencidos" },
      { status: 500 }
    );
  }
}

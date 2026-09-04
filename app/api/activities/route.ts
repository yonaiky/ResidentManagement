import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAuth } from "@/lib/tenant/auth";
import { mergeTenantWhere } from "@/lib/tenant/scope";

export async function GET() {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const tenantWhere = mergeTenantWhere({}, auth.ctx);

    const [recentPayments, recentResidents, recentTokens] = await Promise.all([
      prisma.payment.findMany({
        where: tenantWhere,
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          resident: { select: { name: true, lastName: true } },
        },
      }),
      prisma.resident.findMany({
        where: tenantWhere,
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
      prisma.token.findMany({
        where: tenantWhere,
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          resident: { select: { name: true, lastName: true } },
        },
      }),
    ]);

    const activities = [
      ...recentPayments.map((payment) => ({
        id: payment.id,
        type: "payment" as const,
        title: "Pago Registrado",
        description: `${payment.resident?.name ?? "—"} ${payment.resident?.lastName ?? ""} realizó un pago de $${payment.amount}`,
        timestamp: payment.createdAt.toISOString(),
        status: "success" as const,
      })),
      ...recentResidents.map((resident) => ({
        id: resident.id,
        type: "resident" as const,
        title: "Nuevo Residente",
        description: `${resident.name} ${resident.lastName} se registró como nuevo residente`,
        timestamp: resident.createdAt.toISOString(),
        status: "info" as const,
      })),
      ...recentTokens.map((token) => ({
        id: token.id,
        type: "token" as const,
        title: "Token Generado",
        description: `Se generó un nuevo token para ${token.resident?.name ?? "—"} ${token.resident?.lastName ?? ""}`,
        timestamp: token.createdAt.toISOString(),
        status: "warning" as const,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 10);

    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Error al obtener las actividades" },
      { status: 500 }
    );
  }
}

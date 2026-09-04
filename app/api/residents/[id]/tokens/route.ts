import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAuth } from "@/lib/tenant/auth";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;

  const residentId = parseInt(params.id, 10);
  if (Number.isNaN(residentId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId: auth.ctx.tenantId },
    });
    if (!resident) {
      return NextResponse.json({ error: "Residente no encontrado" }, { status: 404 });
    }

    const tokens = await prisma.token.findMany({
      where: { residentId, tenantId: auth.ctx.tenantId },
      orderBy: { createdAt: "desc" },
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

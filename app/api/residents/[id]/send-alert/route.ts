import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantManager } from "@/lib/tenant/auth";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;

  try {
    const { message } = await request.json();
    const residentId = parseInt(params.id, 10);

    if (Number.isNaN(residentId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId: auth.ctx.tenantId },
    });

    if (!resident) {
      return NextResponse.json(
        { error: "Residente no encontrado" },
        { status: 404 }
      );
    }

    console.log(`Alerta para ${resident.name}: ${message}`);

    return NextResponse.json({
      message: "Alerta procesada",
      resident: {
        id: resident.id,
        name: resident.name,
      },
    });
  } catch (error) {
    console.error("Error al procesar la alerta:", error);
    return NextResponse.json(
      { error: "Error al procesar la alerta" },
      { status: 500 }
    );
  }
}

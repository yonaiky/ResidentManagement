import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAuth, requireTenantManager } from "@/lib/tenant/auth";

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
      include: {
        tokens: true,
        payments: true,
        notifications: true,
      },
    });

    if (!resident) {
      return NextResponse.json(
        { error: "Residente no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(resident);
  } catch (error) {
    console.error("Error fetching resident:", error);
    return NextResponse.json(
      { error: "Error al obtener el residente" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;

  const residentId = parseInt(params.id, 10);
  if (Number.isNaN(residentId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId: auth.ctx.tenantId },
      include: { _count: { select: { payments: true } } },
    });

    if (!resident) {
      return NextResponse.json(
        { error: "Residente no encontrado" },
        { status: 404 }
      );
    }

    if (resident._count.payments > 0) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar un residente con pagos registrados. Contacte al administrador.",
        },
        { status: 409 }
      );
    }

    await prisma.resident.delete({ where: { id: residentId } });

    return NextResponse.json({ message: "Residente eliminado exitosamente" });
  } catch (error) {
    console.error("Error deleting resident:", error);
    return NextResponse.json(
      { error: "Error al eliminar el residente" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAuth, requireTenantManager } from "@/lib/tenant/auth";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;

  const tokenId = parseInt(params.id, 10);
  if (Number.isNaN(tokenId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const token = await prisma.token.findFirst({
      where: { id: tokenId, tenantId: auth.ctx.tenantId },
      include: { resident: true },
    });

    if (!token) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    return NextResponse.json(token);
  } catch (error) {
    console.error("Error fetching token:", error);
    return NextResponse.json(
      {
        error: "Error fetching token",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;

  const tokenId = parseInt(params.id, 10);
  if (Number.isNaN(tokenId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const existing = await prisma.token.findFirst({
      where: { id: tokenId, tenantId: auth.ctx.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, status } = body;

    const token = await prisma.token.update({
      where: { id: tokenId },
      data: { name, status },
    });

    return NextResponse.json(token);
  } catch (error) {
    return NextResponse.json({ error: "Error updating token" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;

  const tokenId = parseInt(params.id, 10);
  if (Number.isNaN(tokenId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const token = await prisma.token.findFirst({
      where: { id: tokenId, tenantId: auth.ctx.tenantId },
    });

    if (!token) {
      return NextResponse.json({ error: "Token no encontrado" }, { status: 404 });
    }

    await prisma.token.delete({ where: { id: tokenId } });

    return NextResponse.json({ message: "Token eliminado exitosamente" });
  } catch (error) {
    console.error("Error deleting token:", error);
    return NextResponse.json(
      { error: "Error al eliminar el token" },
      { status: 500 }
    );
  }
}

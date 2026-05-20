import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAuth, requireTenantManager } from "@/lib/tenant/auth";

type RouteContext = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;

  const structures = await prisma.structure.findMany({
    where: {
      propertyId: params.id,
      property: { tenantId: auth.ctx.tenantId },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ items: structures });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;

  const property = await prisma.property.findFirst({
    where: { id: params.id, tenantId: auth.ctx.tenantId },
  });
  if (!property) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  if (!body.name?.trim() || !body.structureType) {
    return NextResponse.json(
      { error: "name and structureType required" },
      { status: 400 }
    );
  }

  const structure = await prisma.structure.create({
    data: {
      propertyId: params.id,
      parentId: body.parentId || null,
      name: body.name.trim(),
      structureType: body.structureType,
      sortOrder: body.sortOrder ?? 0,
    },
  });

  return NextResponse.json(structure, { status: 201 });
}

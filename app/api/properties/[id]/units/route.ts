import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAuth, requireTenantManager } from "@/lib/tenant/auth";

type RouteContext = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;

  const units = await prisma.unit.findMany({
    where: {
      propertyId: params.id,
      property: { tenantId: auth.ctx.tenantId },
    },
    include: {
      structure: { select: { name: true } },
      occupancies: {
        where: { status: "active" },
        include: { resident: true },
      },
    },
    orderBy: [{ floor: "asc" }, { code: "asc" }],
  });

  return NextResponse.json({ items: units });
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
  if (!body.code?.trim()) {
    return NextResponse.json({ error: "code required" }, { status: 400 });
  }

  const unit = await prisma.unit.create({
    data: {
      propertyId: params.id,
      structureId: body.structureId || null,
      code: String(body.code).trim().toUpperCase(),
      unitType: body.unitType ?? "apartment",
      floor: body.floor != null ? parseInt(String(body.floor), 10) : null,
      bedrooms: body.bedrooms != null ? parseInt(String(body.bedrooms), 10) : null,
      areaSqm: body.areaSqm != null ? parseFloat(String(body.areaSqm)) : null,
      status: body.status ?? "available",
    },
  });

  return NextResponse.json(unit, { status: 201 });
}

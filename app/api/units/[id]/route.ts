import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAuth, requireTenantManager } from "@/lib/tenant/auth";
import { serializeUnitDetail } from "@/lib/tenant/serialize";

type RouteContext = { params: { id: string } };

const unitInclude = {
  structure: { select: { name: true } },
  occupancies: {
    include: {
      resident: { select: { id: true, name: true, lastName: true, cedula: true } },
    },
    orderBy: { startDate: "desc" as const },
  },
};

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;

  const unit = await prisma.unit.findFirst({
    where: {
      id: params.id,
      property: { tenantId: auth.ctx.tenantId },
    },
    include: unitInclude,
  });
  if (!unit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(serializeUnitDetail(unit));
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const existing = await prisma.unit.findFirst({
    where: { id: params.id, property: { tenantId: auth.ctx.tenantId } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (body.structureId) {
    const structure = await prisma.structure.findFirst({
      where: {
        id: body.structureId,
        propertyId: existing.propertyId,
        property: { tenantId: auth.ctx.tenantId },
      },
    });
    if (!structure) {
      return NextResponse.json({ error: "Structure not found" }, { status: 400 });
    }
  }

  try {
    const unit = await prisma.$transaction(async (tx) => {
      const updated = await tx.unit.update({
        where: { id: params.id },
        data: {
          ...(body.code !== undefined && {
            code: String(body.code).trim().toUpperCase(),
          }),
          ...(body.unitType !== undefined && { unitType: body.unitType }),
          ...(body.status !== undefined && { status: body.status }),
          ...(body.floor !== undefined && {
            floor: body.floor === null || body.floor === "" ? null : parseInt(String(body.floor), 10),
          }),
          ...(body.bedrooms !== undefined && {
            bedrooms:
              body.bedrooms === null || body.bedrooms === ""
                ? null
                : parseInt(String(body.bedrooms), 10),
          }),
          ...(body.areaSqm !== undefined && {
            areaSqm:
              body.areaSqm === null || body.areaSqm === ""
                ? null
                : parseFloat(String(body.areaSqm)),
          }),
          ...(body.structureId !== undefined && {
            structureId: body.structureId || null,
          }),
        },
        include: unitInclude,
      });

      if (body.status && body.status !== existing.status) {
        await tx.unitStatusHistory.create({
          data: {
            unitId: params.id,
            fromStatus: existing.status,
            toStatus: body.status,
            changedById: auth.userId,
            note: body.note || null,
          },
        });
      }

      return updated;
    });

    return NextResponse.json(serializeUnitDetail(unit));
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Ya existe una unidad con ese código" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;

  const existing = await prisma.unit.findFirst({
    where: { id: params.id, property: { tenantId: auth.ctx.tenantId } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.unit.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

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

  const unit = await prisma.$transaction(async (tx) => {
    const updated = await tx.unit.update({
      where: { id: params.id },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.floor !== undefined && { floor: body.floor }),
        ...(body.bedrooms !== undefined && { bedrooms: body.bedrooms }),
        ...(body.areaSqm !== undefined && { areaSqm: body.areaSqm }),
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
}

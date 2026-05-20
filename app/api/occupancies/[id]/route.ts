import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantManager } from "@/lib/tenant/auth";

type RouteContext = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;

  const occupancy = await prisma.unitOccupancy.findFirst({
    where: {
      id: params.id,
      unit: { property: { tenantId: auth.ctx.tenantId } },
    },
    include: { unit: true },
  });
  if (!occupancy) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const occ = await tx.unitOccupancy.update({
      where: { id: params.id },
      data: { status: "ended", endDate: new Date() },
    });

    await tx.occupancyHistory.create({
      data: {
        unitId: occupancy.unitId,
        residentId: occupancy.residentId,
        role: occupancy.role,
        action: "ended",
        changedById: auth.userId,
      },
    });

    const activeLeft = await tx.unitOccupancy.count({
      where: { unitId: occupancy.unitId, status: "active" },
    });
    if (activeLeft === 0) {
      const u = await tx.unit.findUnique({ where: { id: occupancy.unitId } });
      if (u && u.status === "occupied") {
        await tx.unit.update({
          where: { id: occupancy.unitId },
          data: { status: "available" },
        });
      }
    }

    return occ;
  });

  return NextResponse.json(updated);
}

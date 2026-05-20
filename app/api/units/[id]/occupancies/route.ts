import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantManager } from "@/lib/tenant/auth";

type RouteContext = { params: { id: string } };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const { residentId, role } = body;

  if (!residentId || !role || !["owner", "tenant"].includes(role)) {
    return NextResponse.json({ error: "residentId and role required" }, { status: 400 });
  }

  const unit = await prisma.unit.findFirst({
    where: { id: params.id, property: { tenantId: auth.ctx.tenantId } },
  });
  if (!unit) {
    return NextResponse.json({ error: "Unit not found" }, { status: 404 });
  }

  const resident = await prisma.resident.findFirst({
    where: { id: parseInt(String(residentId), 10), tenantId: auth.ctx.tenantId },
  });
  if (!resident) {
    return NextResponse.json({ error: "Resident not found" }, { status: 404 });
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.unitOccupancy.updateMany({
      where: { unitId: params.id, role, status: "active" },
      data: { status: "ended", endDate: new Date() },
    });

    const occupancy = await tx.unitOccupancy.create({
      data: {
        unitId: params.id,
        residentId: resident.id,
        role,
        isPrimary: Boolean(body.isPrimary),
        status: "active",
      },
    });

    await tx.occupancyHistory.create({
      data: {
        unitId: params.id,
        residentId: resident.id,
        role,
        action: "assigned",
        changedById: auth.userId,
        note: body.note || null,
      },
    });

    const activeCount = await tx.unitOccupancy.count({
      where: { unitId: params.id, status: "active" },
    });
    if (activeCount > 0 && unit.status !== "maintenance" && unit.status !== "reserved") {
      await tx.unit.update({
        where: { id: params.id },
        data: { status: "occupied" },
      });
    }

    return occupancy;
  });

  return NextResponse.json(result, { status: 201 });
}

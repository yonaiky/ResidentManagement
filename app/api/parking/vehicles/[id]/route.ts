import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParkingManager } from "@/lib/parking/auth";
import { assignmentInclude } from "@/lib/parking/queries";
import { serializeVehicle } from "@/lib/parking/serialize";

type RouteContext = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireParkingManager();
  if (auth instanceof NextResponse) return auth;

  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const existing = await prisma.vehicle.findFirst({
      where: { id, tenantId: auth.ctx.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        ...(body.make !== undefined && {
          make: body.make ? String(body.make).trim() : null,
        }),
        ...(body.model !== undefined && {
          model: body.model ? String(body.model).trim() : null,
        }),
        ...(body.color !== undefined && {
          color: body.color ? String(body.color).trim() : null,
        }),
        ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
      },
      include: {
        resident: {
          select: {
            id: true,
            name: true,
            lastName: true,
            address: true,
            noRegistro: true,
          },
        },
        assignments: {
          where: { endDate: null },
          include: assignmentInclude,
          take: 1,
        },
      },
    });

    return NextResponse.json(
      serializeVehicle(vehicle, vehicle.assignments[0] ?? null)
    );
  } catch (error) {
    console.error("PATCH /api/parking/vehicles/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

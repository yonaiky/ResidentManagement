import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParkingManager } from "@/lib/parking/auth";
import { serializeVisit } from "@/lib/parking/serialize";

type RouteContext = { params: { id: string } };

const visitInclude = {
  hostResident: {
    select: {
      id: true,
      name: true,
      lastName: true,
      address: true,
      noRegistro: true,
    },
  },
  spot: { select: { id: true, code: true } },
} as const;

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireParkingManager();
  if (auth instanceof NextResponse) return auth;

  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const existing = await prisma.parkingVisit.findFirst({
      where: {
        id,
        hostResident: { tenantId: auth.ctx.tenantId },
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const visit = await prisma.parkingVisit.update({
      where: { id },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.spotId !== undefined && {
          spotId: body.spotId ? parseInt(String(body.spotId), 10) : null,
        }),
        ...(body.visitorName !== undefined && {
          visitorName: body.visitorName
            ? String(body.visitorName).trim()
            : null,
        }),
        ...(body.notes !== undefined && {
          notes: body.notes ? String(body.notes).trim() : null,
        }),
      },
      include: visitInclude,
    });

    return NextResponse.json(serializeVisit(visit));
  } catch (error) {
    console.error("PATCH /api/parking/visits/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

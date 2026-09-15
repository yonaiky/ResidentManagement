import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParkingManager } from "@/lib/parking/auth";
import { serializeVisit } from "@/lib/parking/serialize";
import { z } from "zod";
import { parseJsonBody } from "@/lib/validation/http";
import { visitStatusSchema } from "@/lib/validation/enums";
import { optionalLongText, optionalShortText } from "@/lib/validation/common";

type RouteContext = { params: { id: string } };

const patchVisitSchema = z.object({
  status: visitStatusSchema.optional(),
  spotId: z.union([z.coerce.number().int(), z.null(), z.literal("")]).optional(),
  visitorName: optionalShortText.nullable().optional(),
  notes: optionalLongText.nullable().optional(),
});

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
    const parsed = await parseJsonBody(request, patchVisitSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const existing = await prisma.parkingVisit.findFirst({
      where: {
        id,
        hostResident: { tenantId: auth.ctx.tenantId },
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let nextSpotId: number | null | undefined;
    if (body.spotId !== undefined) {
      if (!body.spotId) {
        nextSpotId = null;
      } else {
        const spotId = parseInt(String(body.spotId), 10);
        if (Number.isNaN(spotId)) {
          return NextResponse.json({ error: "Invalid spotId" }, { status: 400 });
        }
        const spot = await prisma.parkingSpot.findFirst({
          where: { id: spotId, tenantId: auth.ctx.tenantId },
          select: { id: true },
        });
        if (!spot) {
          return NextResponse.json(
            { error: "Espacio no encontrado" },
            { status: 404 }
          );
        }
        nextSpotId = spot.id;
      }
    }

    const visit = await prisma.parkingVisit.update({
      where: { id },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(nextSpotId !== undefined && { spotId: nextSpotId }),
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

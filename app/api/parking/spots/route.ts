import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParkingAuth, requireParkingManager } from "@/lib/parking/auth";
import { parseSpotFilters } from "@/lib/parking/filters";
import {
  loadActiveAssignments,
  loadActiveVisitsForAvailability,
} from "@/lib/parking/queries";
import { serializeSpot } from "@/lib/parking/serialize";
import { computeSpotAvailability } from "@/lib/parking/availability";
import { z } from "zod";
import { parseJsonBody } from "@/lib/validation/http";
import { spotStatusSchema, spotTypeSchema } from "@/lib/validation/enums";
import {
  optionalLongText,
  optionalShortText,
  shortText,
} from "@/lib/validation/common";

const createSpotSchema = z.object({
  code: shortText,
  zone: optionalShortText.nullable().optional(),
  spotType: spotTypeSchema.optional(),
  status: spotStatusSchema.optional(),
  notes: optionalLongText.nullable().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireParkingAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const filters = parseSpotFilters(request.nextUrl.searchParams);
    const where: Record<string, unknown> = { tenantId: auth.ctx.tenantId };
    if (auth.ctx.propertyId) where.propertyId = auth.ctx.propertyId;

    if (filters.zone) where.zone = filters.zone;
    if (filters.spotType) where.spotType = filters.spotType;
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search, mode: "insensitive" } },
        { zone: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [spots, assignments, visits] = await Promise.all([
      prisma.parkingSpot.findMany({
        where,
        orderBy: [{ zone: "asc" }, { code: "asc" }],
      }),
      loadActiveAssignments(auth.ctx.tenantId),
      loadActiveVisitsForAvailability(auth.ctx.tenantId),
    ]);

    let items = spots.map((s) => serializeSpot(s, assignments, visits));

    if (filters.availability) {
      items = items.filter((i) => i.computedAvailability === filters.availability);
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error("GET /api/parking/spots error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireParkingManager();
  if (auth instanceof NextResponse) return auth;

  try {
    const parsed = await parseJsonBody(request, createSpotSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const code = body.code;

    const spot = await prisma.parkingSpot.create({
      data: {
        tenantId: auth.ctx.tenantId,
        propertyId: auth.ctx.propertyId,
        code,
        zone: body.zone?.trim() || null,
        spotType: body.spotType ?? "resident",
        status: body.status ?? "available",
        notes: body.notes?.trim() || null,
      },
    });

    const [assignments, visits] = await Promise.all([
      loadActiveAssignments(auth.ctx.tenantId),
      loadActiveVisitsForAvailability(auth.ctx.tenantId),
    ]);

    return NextResponse.json(
      serializeSpot(spot, assignments, visits),
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/parking/spots error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

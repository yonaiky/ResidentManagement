import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParkingAuth, requireParkingManager } from "@/lib/parking/auth";
import { parseVisitFilters } from "@/lib/parking/filters";
import { normalizePlate, validatePlate } from "@/lib/parking/plate";
import { serializeVisit } from "@/lib/parking/serialize";
import type { CreateVisitInput } from "@/lib/parking/types";

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

export async function GET(request: NextRequest) {
  const auth = await requireParkingAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const filters = parseVisitFilters(request.nextUrl.searchParams);
    const where: Record<string, unknown> = {};

    if (filters.residentId) where.hostResidentId = filters.residentId;
    if (filters.status) where.status = filters.status;
    if (filters.plate) {
      where.plateNormalized = { contains: normalizePlate(filters.plate) };
    }
    if (filters.from || filters.to) {
      where.validFrom = {};
      if (filters.from) {
        (where.validFrom as Record<string, Date>).gte = filters.from;
      }
      if (filters.to) {
        where.validTo = { lte: filters.to };
      }
    }

    const visits = await prisma.parkingVisit.findMany({
      where,
      include: visitInclude,
      orderBy: { validFrom: "desc" },
      take: 100,
    });

    return NextResponse.json({
      items: visits.map(serializeVisit),
    });
  } catch (error) {
    console.error("GET /api/parking/visits error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireParkingManager();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await request.json()) as CreateVisitInput;
    const plateCheck = validatePlate(body.plate ?? "");
    if (!plateCheck.ok) {
      return NextResponse.json({ error: plateCheck.error }, { status: 400 });
    }
    if (!body.hostResidentId) {
      return NextResponse.json({ error: "hostResidentId is required" }, { status: 400 });
    }

    const validFrom = new Date(body.validFrom);
    const validTo = new Date(body.validTo);
    if (Number.isNaN(validFrom.getTime()) || Number.isNaN(validTo.getTime())) {
      return NextResponse.json({ error: "Fechas inválidas" }, { status: 400 });
    }
    if (validTo <= validFrom) {
      return NextResponse.json(
        { error: "validTo debe ser posterior a validFrom" },
        { status: 400 }
      );
    }

    const host = await prisma.resident.findUnique({
      where: { id: body.hostResidentId },
    });
    if (!host) {
      return NextResponse.json({ error: "Resident not found" }, { status: 404 });
    }

    const visit = await prisma.parkingVisit.create({
      data: {
        plate: body.plate.trim(),
        plateNormalized: normalizePlate(body.plate),
        visitorName: body.visitorName?.trim() || null,
        hostResidentId: body.hostResidentId,
        validFrom,
        validTo,
        status: "scheduled",
        spotId: body.spotId ?? null,
        notes: body.notes?.trim() || null,
      },
      include: visitInclude,
    });

    return NextResponse.json(serializeVisit(visit), { status: 201 });
  } catch (error) {
    console.error("POST /api/parking/visits error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

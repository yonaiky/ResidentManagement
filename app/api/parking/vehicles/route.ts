import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParkingAuth, requireParkingManager } from "@/lib/parking/auth";
import { parseVehicleFilters } from "@/lib/parking/filters";
import { normalizePlate, validatePlate } from "@/lib/parking/plate";
import { assignmentInclude } from "@/lib/parking/queries";
import { serializeVehicle } from "@/lib/parking/serialize";
import type { CreateVehicleInput } from "@/lib/parking/types";

export async function GET(request: NextRequest) {
  const auth = await requireParkingAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const filters = parseVehicleFilters(request.nextUrl.searchParams);
    const where: Record<string, unknown> = { tenantId: auth.ctx.tenantId };

    if (filters.residentId) where.residentId = filters.residentId;
    if (filters.activeOnly !== false) where.isActive = true;
    if (filters.plate) {
      where.plateNormalized = {
        contains: normalizePlate(filters.plate),
      };
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
    });

    const items = vehicles.map((v) =>
      serializeVehicle(v, v.assignments[0] ?? null)
    );

    return NextResponse.json({ items });
  } catch (error) {
    console.error("GET /api/parking/vehicles error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireParkingManager();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await request.json()) as CreateVehicleInput;
    const plateCheck = validatePlate(body.plate ?? "");
    if (!plateCheck.ok) {
      return NextResponse.json({ error: plateCheck.error }, { status: 400 });
    }
    if (!body.residentId) {
      return NextResponse.json({ error: "residentId is required" }, { status: 400 });
    }

    const resident = await prisma.resident.findFirst({
      where: { id: body.residentId, tenantId: auth.ctx.tenantId },
    });
    if (!resident) {
      return NextResponse.json({ error: "Resident not found" }, { status: 404 });
    }

    const plateNormalized = normalizePlate(body.plate);
    const existing = await prisma.vehicle.findFirst({
      where: { plateNormalized, tenantId: auth.ctx.tenantId },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un vehículo con esta placa" },
        { status: 409 }
      );
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        tenantId: auth.ctx.tenantId,
        plate: body.plate.trim(),
        plateNormalized,
        make: body.make?.trim() || null,
        model: body.model?.trim() || null,
        color: body.color?.trim() || null,
        residentId: body.residentId,
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
      },
    });

    return NextResponse.json(serializeVehicle(vehicle, null), { status: 201 });
  } catch (error) {
    console.error("POST /api/parking/vehicles error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParkingAuth, requireParkingManager } from "@/lib/parking/auth";
import { parseFineFilters } from "@/lib/parking/filters";
import { normalizePlate, validatePlate } from "@/lib/parking/plate";
import { serializeFine } from "@/lib/parking/serialize";
import type { CreateFineInput } from "@/lib/parking/types";

const fineInclude = {
  resident: {
    select: {
      id: true,
      name: true,
      lastName: true,
      address: true,
      noRegistro: true,
    },
  },
  issuedBy: { select: { id: true, username: true } },
} as const;

export async function GET(request: NextRequest) {
  const auth = await requireParkingAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const filters = parseFineFilters(request.nextUrl.searchParams);
    const where: Record<string, unknown> = { tenantId: auth.ctx.tenantId };

    if (filters.status) where.status = filters.status;
    if (filters.residentId) where.residentId = filters.residentId;
    if (filters.plate) {
      where.plateNormalized = { contains: normalizePlate(filters.plate) };
    }

    const fines = await prisma.parkingFine.findMany({
      where,
      include: fineInclude,
      orderBy: { issuedAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      items: fines.map(serializeFine),
    });
  } catch (error) {
    console.error("GET /api/parking/fines error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireParkingManager();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await request.json()) as CreateFineInput;
    const plateCheck = validatePlate(body.plate ?? "");
    if (!plateCheck.ok) {
      return NextResponse.json({ error: plateCheck.error }, { status: 400 });
    }
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json({ error: "amount must be positive" }, { status: 400 });
    }
    if (!body.reason?.trim()) {
      return NextResponse.json({ error: "reason is required" }, { status: 400 });
    }

    const plateNormalized = normalizePlate(body.plate);
    const vehicle = await prisma.vehicle.findFirst({
      where: { plateNormalized, tenantId: auth.ctx.tenantId },
      include: { resident: true },
    });

    let residentId = body.residentId ?? vehicle?.residentId ?? null;
    if (body.residentId) {
      const r = await prisma.resident.findFirst({
        where: { id: body.residentId, tenantId: auth.ctx.tenantId },
      });
      if (!r) {
        return NextResponse.json({ error: "Resident not found" }, { status: 404 });
      }
      residentId = body.residentId;
    }

    const fine = await prisma.parkingFine.create({
      data: {
        tenantId: auth.ctx.tenantId,
        plate: body.plate.trim(),
        plateNormalized,
        vehicleId: vehicle?.id ?? null,
        residentId,
        amount: body.amount,
        reason: body.reason.trim(),
        status: "pending",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        notes: body.notes?.trim() || null,
        issuedById: auth.userId,
      },
      include: fineInclude,
    });

    return NextResponse.json(serializeFine(fine), { status: 201 });
  } catch (error) {
    console.error("POST /api/parking/fines error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParkingAuth, requireParkingManager } from "@/lib/parking/auth";
import { parseVisitFilters } from "@/lib/parking/filters";
import { normalizePlate, validatePlate } from "@/lib/parking/plate";
import { serializeVisit } from "@/lib/parking/serialize";
import type { CreateVisitInput } from "@/lib/parking/types";
import { resolveOrganizationId } from "@/lib/finance/org";
import { generateAccessCode } from "@/lib/operations/access-code";
import { emitOpsEvent, OPS_EVENTS } from "@/lib/operations/events";

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
    const where: Record<string, unknown> = {
      OR: [
        { tenantId: auth.ctx.tenantId },
        {
          tenantId: null,
          hostResident: { tenantId: auth.ctx.tenantId },
        },
      ],
    };

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

    const page = Math.max(
      1,
      parseInt(request.nextUrl.searchParams.get("page") || "1", 10) || 1
    );
    const pageSize = Math.min(
      100,
      Math.max(
        1,
        parseInt(request.nextUrl.searchParams.get("pageSize") || "50", 10) || 50
      )
    );

    const [total, visits] = await Promise.all([
      prisma.parkingVisit.count({ where }),
      prisma.parkingVisit.findMany({
        where,
        include: visitInclude,
        orderBy: { validFrom: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      items: visits.map(serializeVisit),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("GET /api/parking/visits error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireParkingManager();
  if (auth instanceof NextResponse) return auth;
  const org = await resolveOrganizationId(auth);
  if (org instanceof NextResponse) return org;

  try {
    const body = (await request.json()) as CreateVisitInput & {
      visitorDocument?: string;
      generateAccess?: boolean;
    };
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

    const host = await prisma.resident.findFirst({
      where: { id: body.hostResidentId, tenantId: auth.ctx.tenantId },
    });
    if (!host) {
      return NextResponse.json({ error: "Resident not found" }, { status: 404 });
    }

    if (body.spotId) {
      const spot = await prisma.parkingSpot.findFirst({
        where: { id: body.spotId, tenantId: auth.ctx.tenantId },
      });
      if (!spot) {
        return NextResponse.json({ error: "Spot not found" }, { status: 404 });
      }
    }

    const accessCode =
      body.generateAccess === false ? null : generateAccessCode();

    const visit = await prisma.parkingVisit.create({
      data: {
        tenantId: auth.ctx.tenantId,
        organizationId: org.organizationId,
        plate: body.plate.trim(),
        plateNormalized: normalizePlate(body.plate),
        visitorName: body.visitorName?.trim() || null,
        visitorDocument: body.visitorDocument?.trim() || null,
        hostResidentId: body.hostResidentId,
        validFrom,
        validTo,
        status: "scheduled",
        spotId: body.spotId ?? null,
        notes: body.notes?.trim() || null,
        accessCode,
        accessExpiresAt: accessCode ? validTo : null,
      },
      include: visitInclude,
    });

    await emitOpsEvent({
      tenantId: auth.ctx.tenantId,
      organizationId: org.organizationId,
      userId: auth.userId,
      event: OPS_EVENTS.VisitorPreauthorized,
      entity: "ParkingVisit",
      entityId: String(visit.id),
      payload: { visitorName: visit.visitorName, hostResidentId: visit.hostResidentId },
    });

    return NextResponse.json(serializeVisit(visit), { status: 201 });
  } catch (error) {
    console.error("POST /api/parking/visits error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

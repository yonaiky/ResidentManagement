import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParkingAuth, requireParkingManager } from "@/lib/parking/auth";
import { computeSpotAvailability } from "@/lib/parking/availability";
import { assignmentInclude } from "@/lib/parking/queries";
import { serializeAssignment } from "@/lib/parking/serialize";
import type { CreateAssignmentInput } from "@/lib/parking/types";

export async function GET(request: NextRequest) {
  const auth = await requireParkingAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const activeOnly = request.nextUrl.searchParams.get("activeOnly") !== "false";
    const residentId = request.nextUrl.searchParams.get("residentId");
    const vehicleId = request.nextUrl.searchParams.get("vehicleId");

    const where: Record<string, unknown> = {
      spot: { tenantId: auth.ctx.tenantId },
    };
    if (activeOnly) where.endDate = null;
    if (residentId) where.residentId = parseInt(residentId, 10);
    if (vehicleId) where.vehicleId = parseInt(vehicleId, 10);

    const assignments = await prisma.parkingAssignment.findMany({
      where,
      include: assignmentInclude,
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json({
      items: assignments.map(serializeAssignment),
    });
  } catch (error) {
    console.error("GET /api/parking/assignments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireParkingManager();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await request.json()) as CreateAssignmentInput;
    const { spotId, vehicleId } = body;

    if (!spotId || !vehicleId) {
      return NextResponse.json(
        { error: "spotId and vehicleId are required" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findUnique({
        where: { id: vehicleId },
        include: { resident: true },
      });
      if (!vehicle || !vehicle.isActive) {
        throw new Error("VEHICLE_NOT_FOUND");
      }

      const spot = await tx.parkingSpot.findUnique({ where: { id: spotId } });
      if (!spot) throw new Error("SPOT_NOT_FOUND");

      const activeAssignments = await tx.parkingAssignment.findMany({
        where: { endDate: null },
      });
      const activeVisits = await tx.parkingVisit.findMany({
        where: {
          status: { not: "cancelled" },
          spotId: { not: null },
          validTo: { gte: new Date() },
        },
        select: {
          spotId: true,
          validFrom: true,
          validTo: true,
          status: true,
        },
      });

      const availability = computeSpotAvailability(
        spot,
        activeAssignments.map((a) => ({ spotId: a.spotId, endDate: a.endDate })),
        activeVisits.map((v) => ({
          spotId: v.spotId,
          validFrom: v.validFrom,
          validTo: v.validTo,
          status: v.status,
        }))
      );

      if (availability !== "available") {
        throw new Error("SPOT_NOT_AVAILABLE");
      }

      const now = new Date();

      await tx.parkingAssignment.updateMany({
        where: { spotId, endDate: null },
        data: { endDate: now },
      });

      await tx.parkingAssignment.updateMany({
        where: { vehicleId, endDate: null },
        data: { endDate: now },
      });

      return tx.parkingAssignment.create({
        data: {
          spotId,
          vehicleId,
          residentId: vehicle.residentId,
          startDate: now,
        },
        include: assignmentInclude,
      });
    });

    return NextResponse.json(serializeAssignment(result), { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "VEHICLE_NOT_FOUND") {
        return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });
      }
      if (error.message === "SPOT_NOT_FOUND") {
        return NextResponse.json({ error: "Espacio no encontrado" }, { status: 404 });
      }
      if (error.message === "SPOT_NOT_AVAILABLE") {
        return NextResponse.json(
          { error: "El espacio no está disponible" },
          { status: 409 }
        );
      }
    }
    console.error("POST /api/parking/assignments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

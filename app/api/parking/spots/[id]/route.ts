import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireParkingAuth,
  requireParkingAdmin,
  requireParkingManager,
} from "@/lib/parking/auth";
import {
  loadActiveAssignments,
  loadActiveVisitsForAvailability,
} from "@/lib/parking/queries";
import { serializeSpot } from "@/lib/parking/serialize";

type RouteContext = { params: { id: string } };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireParkingAuth();
  if (auth instanceof NextResponse) return auth;

  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const spot = await prisma.parkingSpot.findFirst({
      where: { id, tenantId: auth.ctx.tenantId },
    });
    if (!spot) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [assignments, visits] = await Promise.all([
      loadActiveAssignments(auth.ctx.tenantId),
      loadActiveVisitsForAvailability(auth.ctx.tenantId),
    ]);

    return NextResponse.json(serializeSpot(spot, assignments, visits));
  } catch (error) {
    console.error("GET /api/parking/spots/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireParkingManager();
  if (auth instanceof NextResponse) return auth;

  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const existing = await prisma.parkingSpot.findFirst({
      where: { id, tenantId: auth.ctx.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const spot = await prisma.parkingSpot.update({
      where: { id },
      data: {
        ...(body.code !== undefined && { code: String(body.code).trim() }),
        ...(body.zone !== undefined && {
          zone: body.zone ? String(body.zone).trim() : null,
        }),
        ...(body.spotType !== undefined && { spotType: body.spotType }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.notes !== undefined && {
          notes: body.notes ? String(body.notes).trim() : null,
        }),
      },
    });

    const [assignments, visits] = await Promise.all([
      loadActiveAssignments(auth.ctx.tenantId),
      loadActiveVisitsForAvailability(auth.ctx.tenantId),
    ]);

    return NextResponse.json(serializeSpot(spot, assignments, visits));
  } catch (error) {
    console.error("PATCH /api/parking/spots/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireParkingAdmin();
  if (auth instanceof NextResponse) return auth;

  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const spot = await prisma.parkingSpot.findFirst({
      where: { id, tenantId: auth.ctx.tenantId },
    });
    if (!spot) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const assignmentCount = await prisma.parkingAssignment.count({
      where: { spotId: id },
    });
    if (assignmentCount > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar: tiene historial de asignaciones" },
        { status: 409 }
      );
    }

    await prisma.parkingSpot.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/parking/spots/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

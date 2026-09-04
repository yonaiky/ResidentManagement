import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParkingManager } from "@/lib/parking/auth";
import { serializeVisit } from "@/lib/parking/serialize";
import { emitOpsEvent, OPS_EVENTS } from "@/lib/operations/events";

function parseId(id: string): number | null {
  const n = parseInt(id, 10);
  return Number.isNaN(n) ? null : n;
}

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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireParkingManager();
  if (auth instanceof NextResponse) return auth;

  const visitId = parseId(params.id);
  if (visitId == null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { note?: string };

    const existing = await prisma.parkingVisit.findFirst({
      where: {
        id: visitId,
        OR: [
          { tenantId: auth.ctx.tenantId },
          { tenantId: null, hostResident: { tenantId: auth.ctx.tenantId } },
        ],
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }
    if (!existing.checkedInAt) {
      return NextResponse.json(
        { error: "Debe registrar entrada primero" },
        { status: 400 }
      );
    }
    if (existing.checkedOutAt) {
      return NextResponse.json({ error: "Ya registrado salida" }, { status: 400 });
    }

    const now = new Date();
    const visit = await prisma.parkingVisit.update({
      where: { id: visitId },
      data: {
        checkedOutAt: now,
        checkedOutById: auth.userId,
        status: "checked_out",
        notes: body.note
          ? `${existing.notes ? existing.notes + "\n" : ""}[OUT] ${body.note}`
          : existing.notes,
      },
      include: visitInclude,
    });

    await emitOpsEvent({
      tenantId: auth.ctx.tenantId,
      organizationId: existing.organizationId,
      userId: auth.userId,
      event: OPS_EVENTS.VisitorCheckedOut,
      entity: "ParkingVisit",
      entityId: String(visit.id),
    });

    return NextResponse.json(serializeVisit(visit));
  } catch (error) {
    console.error("POST check-out error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

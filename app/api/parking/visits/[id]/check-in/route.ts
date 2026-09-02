import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParkingManager } from "@/lib/parking/auth";
import { serializeVisit } from "@/lib/parking/serialize";
import { isAccessCodeValid } from "@/lib/operations/access-code";
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

async function loadVisit(id: number, tenantId: string) {
  return prisma.parkingVisit.findFirst({
    where: {
      id,
      OR: [
        { tenantId },
        { tenantId: null, hostResident: { tenantId } },
      ],
    },
    include: visitInclude,
  });
}

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
    const body = (await request.json().catch(() => ({}))) as {
      accessCode?: string;
      note?: string;
    };

    const existing = await loadVisit(visitId, auth.ctx.tenantId);
    if (!existing) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }
    if (existing.checkedInAt) {
      return NextResponse.json({ error: "Ya registrado entrada" }, { status: 400 });
    }
    if (existing.status === "cancelled") {
      return NextResponse.json({ error: "Visita cancelada" }, { status: 400 });
    }

    const now = new Date();
    if (now < existing.validFrom || now > existing.validTo) {
      return NextResponse.json(
        { error: "Fuera de la ventana de validez" },
        { status: 400 }
      );
    }

    if (existing.accessCode) {
      const ok = isAccessCodeValid({
        code: body.accessCode,
        expected: existing.accessCode,
        expiresAt: existing.accessExpiresAt,
        now,
      });
      if (!ok) {
        return NextResponse.json(
          { error: "Código de acceso inválido o expirado" },
          { status: 403 }
        );
      }
    }

    const visit = await prisma.parkingVisit.update({
      where: { id: visitId },
      data: {
        checkedInAt: now,
        checkedInById: auth.userId,
        status: "checked_in",
        notes: body.note
          ? `${existing.notes ? existing.notes + "\n" : ""}[IN] ${body.note}`
          : existing.notes,
      },
      include: visitInclude,
    });

    await emitOpsEvent({
      tenantId: auth.ctx.tenantId,
      organizationId: existing.organizationId,
      userId: auth.userId,
      event: OPS_EVENTS.VisitorCheckedIn,
      entity: "ParkingVisit",
      entityId: String(visit.id),
    });

    return NextResponse.json(serializeVisit(visit));
  } catch (error) {
    console.error("POST check-in error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

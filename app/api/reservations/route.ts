import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAuth, requireTenantManager } from "@/lib/tenant/auth";
import { resolveOrganizationId } from "@/lib/finance/org";
import {
  approveReservation,
  createReservation,
} from "@/lib/reservations/service";
import { emitOpsEvent, OPS_EVENTS } from "@/lib/operations/events";
import { moneyToNumber } from "@/lib/finance/money";

function serializeReservation(r: {
  id: string;
  commonAreaId: string;
  unitId: string | null;
  residentId: number | null;
  startAt: Date;
  endAt: Date;
  status: string;
  amount: unknown;
  chargeId: string | null;
  notes: string | null;
  createdAt: Date;
  commonArea?: { name: string };
}) {
  return {
    id: r.id,
    commonAreaId: r.commonAreaId,
    commonAreaName: r.commonArea?.name,
    unitId: r.unitId,
    residentId: r.residentId,
    startAt: r.startAt.toISOString(),
    endAt: r.endAt.toISOString(),
    status: r.status,
    amount: r.amount != null ? moneyToNumber(r.amount as never) : null,
    chargeId: r.chargeId,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;
  const org = await resolveOrganizationId(auth);
  if (org instanceof NextResponse) return org;

  const status = request.nextUrl.searchParams.get("status");
  const commonAreaId = request.nextUrl.searchParams.get("commonAreaId");
  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get("pageSize") || "20", 10) || 20));

  const where: Record<string, unknown> = {
    tenantId: auth.ctx.tenantId,
    organizationId: org.organizationId,
  };
  if (status) where.status = status;
  if (commonAreaId) where.commonAreaId = commonAreaId;

  const [total, items] = await Promise.all([
    prisma.reservation.count({ where }),
    prisma.reservation.findMany({
      where,
      include: { commonArea: { select: { name: true } } },
      orderBy: { startAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    items: items.map(serializeReservation),
    total,
    page,
    pageSize,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;
  const org = await resolveOrganizationId(auth);
  if (org instanceof NextResponse) return org;

  try {
    const body = await request.json();
    const startAt = new Date(body.startAt);
    const endAt = new Date(body.endAt);
    if (!body.commonAreaId || Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    if (body.unitId) {
      const unit = await prisma.unit.findFirst({
        where: {
          id: body.unitId,
          property: { tenantId: auth.ctx.tenantId },
        },
      });
      if (!unit) {
        return NextResponse.json({ error: "Unidad no encontrada" }, { status: 404 });
      }
    }

    const reservation = await createReservation({
      tenantId: auth.ctx.tenantId,
      organizationId: org.organizationId,
      commonAreaId: body.commonAreaId,
      unitId: body.unitId ?? null,
      residentId: body.residentId ?? null,
      startAt,
      endAt,
      notes: body.notes,
      createdByUserId: auth.userId,
    });

    return NextResponse.json(serializeReservation({ ...reservation, commonArea: undefined }), {
      status: 201,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 400 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;
  const org = await resolveOrganizationId(auth);
  if (org instanceof NextResponse) return org;

  try {
    const body = await request.json();
    const { id, action } = body as { id?: string; action?: string };
    if (!id || !action) {
      return NextResponse.json({ error: "id y action requeridos" }, { status: 400 });
    }

    if (action === "approve") {
      const updated = await approveReservation({
        id,
        tenantId: auth.ctx.tenantId,
        organizationId: org.organizationId,
        userId: auth.userId,
      });
      return NextResponse.json(serializeReservation({ ...updated, commonArea: undefined }));
    }

    const existing = await prisma.reservation.findFirst({
      where: {
        id,
        tenantId: auth.ctx.tenantId,
        organizationId: org.organizationId,
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (action === "reject") {
      if (existing.status !== "PENDING") {
        return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
      }
      const updated = await prisma.reservation.update({
        where: { id },
        data: { status: "REJECTED", rejectedAt: new Date() },
      });
      await emitOpsEvent({
        tenantId: auth.ctx.tenantId,
        organizationId: org.organizationId,
        userId: auth.userId,
        event: OPS_EVENTS.ReservationRejected,
        entity: "Reservation",
        entityId: id,
      });
      return NextResponse.json(serializeReservation({ ...updated, commonArea: undefined }));
    }

    if (action === "cancel") {
      if (["CANCELLED", "COMPLETED", "REJECTED"].includes(existing.status)) {
        return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
      }
      const updated = await prisma.reservation.update({
        where: { id },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
      await emitOpsEvent({
        tenantId: auth.ctx.tenantId,
        organizationId: org.organizationId,
        userId: auth.userId,
        event: OPS_EVENTS.ReservationCancelled,
        entity: "Reservation",
        entityId: id,
      });
      return NextResponse.json(serializeReservation({ ...updated, commonArea: undefined }));
    }

    return NextResponse.json({ error: "action desconocida" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 400 }
    );
  }
}

import { prisma } from "@/lib/prisma";
import { createAdHocCharge } from "@/lib/finance/adhoc-charge";
import { moneyToNumber } from "@/lib/finance/money";
import { emitOpsEvent, OPS_EVENTS } from "@/lib/operations/events";
import {
  durationMinutes,
  hasReservationOverlap,
  isWithinAreaHours,
} from "./overlap";
import { getUnitBalance } from "@/lib/finance/fees";

export type CreateReservationInput = {
  tenantId: string;
  organizationId: string;
  commonAreaId: string;
  unitId?: string | null;
  residentId?: number | null;
  startAt: Date;
  endAt: Date;
  notes?: string | null;
  createdByUserId?: string | null;
};

export async function createReservation(input: CreateReservationInput) {
  const area = await prisma.commonArea.findFirst({
    where: {
      id: input.commonAreaId,
      tenantId: input.tenantId,
      organizationId: input.organizationId,
      status: "ACTIVE",
    },
  });
  if (!area) throw new Error("Área común no encontrada");

  if (input.endAt <= input.startAt) {
    throw new Error("Horario inválido");
  }

  if (
    !isWithinAreaHours(
      input.startAt,
      input.endAt,
      area.openTime,
      area.closeTime
    )
  ) {
    throw new Error("Fuera del horario permitido del área");
  }

  const mins = durationMinutes(input.startAt, input.endAt);
  if (mins < area.minDurationMin) {
    throw new Error(`Duración mínima: ${area.minDurationMin} minutos`);
  }
  if (mins > area.maxDurationMin) {
    throw new Error(`Duración máxima: ${area.maxDurationMin} minutos`);
  }

  if (area.minAdvanceHours != null && area.minAdvanceHours > 0) {
    const minStart = new Date(
      Date.now() + area.minAdvanceHours * 60 * 60 * 1000
    );
    if (input.startAt < minStart) {
      throw new Error(
        `Se requieren al menos ${area.minAdvanceHours}h de anticipación`
      );
    }
  }

  if (input.unitId && area.maxMonthlyPerUnit != null) {
    const monthStart = new Date(
      input.startAt.getFullYear(),
      input.startAt.getMonth(),
      1
    );
    const monthEnd = new Date(
      input.startAt.getFullYear(),
      input.startAt.getMonth() + 1,
      1
    );
    const count = await prisma.reservation.count({
      where: {
        commonAreaId: area.id,
        unitId: input.unitId,
        status: { in: ["PENDING", "APPROVED", "COMPLETED"] },
        startAt: { gte: monthStart, lt: monthEnd },
      },
    });
    if (count >= area.maxMonthlyPerUnit) {
      throw new Error("Límite mensual de reservas por unidad alcanzado");
    }
  }

  if (area.blockIfDebt && input.unitId) {
    const balance = await getUnitBalance(
      input.tenantId,
      input.organizationId,
      input.unitId
    );
    if (balance.totalOutstanding > 0) {
      throw new Error("Unidad con deuda: reserva bloqueada por configuración");
    }
  }

  const overlap = await hasReservationOverlap({
    commonAreaId: area.id,
    startAt: input.startAt,
    endAt: input.endAt,
  });
  if (overlap) {
    throw new Error("Conflicto: ya existe una reserva en ese horario");
  }

  const price =
    area.priceAmount != null ? moneyToNumber(area.priceAmount) : null;
  const status = area.requiresApproval ? "PENDING" : "APPROVED";

  const reservation = await prisma.reservation.create({
    data: {
      tenantId: input.tenantId,
      organizationId: input.organizationId,
      commonAreaId: area.id,
      unitId: input.unitId ?? null,
      residentId: input.residentId ?? null,
      startAt: input.startAt,
      endAt: input.endAt,
      status,
      amount: price != null ? price : null,
      notes: input.notes?.trim() || null,
      createdByUserId: input.createdByUserId ?? null,
      approvedAt: status === "APPROVED" ? new Date() : null,
      approvedByUserId:
        status === "APPROVED" ? input.createdByUserId ?? null : null,
    },
  });

  let chargeId: string | null = null;
  if (status === "APPROVED" && price != null && price > 0 && input.unitId) {
    const charge = await createAdHocCharge({
      tenantId: input.tenantId,
      organizationId: input.organizationId,
      unitId: input.unitId,
      residentId: input.residentId,
      concept: `Reserva ${area.name}`,
      amount: price,
      dueDate: input.startAt,
      userId: input.createdByUserId,
    });
    chargeId = charge.id;
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { chargeId },
    });
  }

  await emitOpsEvent({
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    userId: input.createdByUserId,
    event: OPS_EVENTS.ReservationCreated,
    entity: "Reservation",
    entityId: reservation.id,
    payload: { status, commonAreaId: area.id },
  });

  return { ...reservation, chargeId };
}

export async function approveReservation(params: {
  id: string;
  tenantId: string;
  organizationId: string;
  userId: string;
}) {
  const reservation = await prisma.reservation.findFirst({
    where: {
      id: params.id,
      tenantId: params.tenantId,
      organizationId: params.organizationId,
    },
    include: { commonArea: true },
  });
  if (!reservation) throw new Error("Reserva no encontrada");
  if (reservation.status !== "PENDING") {
    throw new Error("Solo se pueden aprobar reservas pendientes");
  }

  const overlap = await hasReservationOverlap({
    commonAreaId: reservation.commonAreaId,
    startAt: reservation.startAt,
    endAt: reservation.endAt,
    excludeId: reservation.id,
  });
  if (overlap) {
    throw new Error("Conflicto de horario al aprobar");
  }

  let chargeId = reservation.chargeId;
  const price =
    reservation.amount != null
      ? moneyToNumber(reservation.amount)
      : reservation.commonArea.priceAmount != null
        ? moneyToNumber(reservation.commonArea.priceAmount)
        : null;

  if (!chargeId && price != null && price > 0 && reservation.unitId) {
    const charge = await createAdHocCharge({
      tenantId: params.tenantId,
      organizationId: params.organizationId,
      unitId: reservation.unitId,
      residentId: reservation.residentId,
      concept: `Reserva ${reservation.commonArea.name}`,
      amount: price,
      dueDate: reservation.startAt,
      userId: params.userId,
    });
    chargeId = charge.id;
  }

  const updated = await prisma.reservation.update({
    where: { id: reservation.id },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      approvedByUserId: params.userId,
      chargeId,
      amount: price,
    },
  });

  await emitOpsEvent({
    tenantId: params.tenantId,
    organizationId: params.organizationId,
    userId: params.userId,
    event: OPS_EVENTS.ReservationApproved,
    entity: "Reservation",
    entityId: updated.id,
  });

  return updated;
}

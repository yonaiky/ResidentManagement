import { prisma } from "@/lib/prisma";

const BLOCKING_STATUSES = ["PENDING", "APPROVED"] as const;

/**
 * True si existe otra reserva bloqueante con solape de horario
 * en la misma área (intervalos [start, end) half-open).
 */
export async function hasReservationOverlap(params: {
  commonAreaId: string;
  startAt: Date;
  endAt: Date;
  excludeId?: string;
}): Promise<boolean> {
  if (params.endAt <= params.startAt) return true;

  const conflict = await prisma.reservation.findFirst({
    where: {
      commonAreaId: params.commonAreaId,
      status: { in: [...BLOCKING_STATUSES] },
      ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
      startAt: { lt: params.endAt },
      endAt: { gt: params.startAt },
    },
    select: { id: true },
  });

  return Boolean(conflict);
}

export function parseTimeToMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

export function isWithinAreaHours(
  startAt: Date,
  endAt: Date,
  openTime: string,
  closeTime: string
): boolean {
  const open = parseTimeToMinutes(openTime);
  const close = parseTimeToMinutes(closeTime);
  if (open == null || close == null) return false;
  if (startAt.toDateString() !== endAt.toDateString()) return false;

  const startMin = startAt.getHours() * 60 + startAt.getMinutes();
  const endMin = endAt.getHours() * 60 + endAt.getMinutes();
  return startMin >= open && endMin <= close && endMin > startMin;
}

export function durationMinutes(startAt: Date, endAt: Date): number {
  return Math.round((endAt.getTime() - startAt.getTime()) / 60000);
}

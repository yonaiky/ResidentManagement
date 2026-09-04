import { prisma } from "@/lib/prisma";
import { CLOSED_STATUSES, DEFAULT_SLA_HOURS } from "./constants";

/** Defaults por prioridad si no hay regla configurada (Fase 3 SLA básico). */
const PRIORITY_DEFAULT_HOURS: Record<string, number> = {
  urgent: 4,
  high: 8,
  medium: 24,
  low: 72,
};

export async function getResolutionHours(
  tenantId: string,
  category: string,
  priority: string
): Promise<number> {
  const rule = await prisma.maintenanceSlaRule.findUnique({
    where: {
      tenantId_category_priority: { tenantId, category, priority },
    },
  });
  if (rule) return rule.resolutionHours;
  return PRIORITY_DEFAULT_HOURS[priority] ?? DEFAULT_SLA_HOURS;
}

export async function computeSlaDueAt(
  tenantId: string,
  category: string,
  priority: string,
  createdAt: Date
): Promise<Date> {
  const hours = await getResolutionHours(tenantId, category, priority);
  return new Date(createdAt.getTime() + hours * 60 * 60 * 1000);
}

export function isSlaBreached(
  slaDueAt: Date | null,
  status: string,
  now: Date = new Date()
): boolean {
  if (!slaDueAt) return false;
  if (CLOSED_STATUSES.includes(status as (typeof CLOSED_STATUSES)[number])) {
    return false;
  }
  return now > slaDueAt;
}

export type SlaDisplayStatus = "ok" | "warning" | "breached" | "none";

export function getSlaDisplayStatus(
  slaDueAt: Date | null,
  slaBreached: boolean,
  status: string,
  createdAt: Date,
  now: Date = new Date()
): SlaDisplayStatus {
  if (!slaDueAt || CLOSED_STATUSES.includes(status as (typeof CLOSED_STATUSES)[number])) {
    return "none";
  }
  if (slaBreached || now > slaDueAt) return "breached";

  const totalMs = slaDueAt.getTime() - createdAt.getTime();
  const remainingMs = slaDueAt.getTime() - now.getTime();
  if (totalMs <= 0) return "breached";
  const ratio = remainingMs / totalMs;
  if (ratio < 0.25) return "warning";
  return "ok";
}

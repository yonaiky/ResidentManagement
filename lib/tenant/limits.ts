import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type SubscriptionPlan } from "./plans";

export type LimitResource =
  | "properties"
  | "users"
  | "residents"
  | "tokens_monthly";

type TenantLike = {
  id: string;
  plan: string;
  maxProperties: number | null;
  maxUsers: number | null;
  maxResidents: number | null;
  maxTokensPerMonth: number | null;
};

function getLimit(tenant: TenantLike, resource: LimitResource): number | null {
  const plan = (tenant.plan as SubscriptionPlan) || "BASIC";
  const defaults = PLAN_LIMITS[plan] ?? PLAN_LIMITS.BASIC;

  switch (resource) {
    case "properties":
      return tenant.maxProperties ?? defaults.maxProperties;
    case "users":
      return tenant.maxUsers ?? defaults.maxUsers;
    case "residents":
      return tenant.maxResidents ?? defaults.maxResidents;
    case "tokens_monthly":
      return tenant.maxTokensPerMonth ?? defaults.maxTokensPerMonth;
    default:
      return null;
  }
}

async function countUsage(tenantId: string, resource: LimitResource): Promise<number> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  switch (resource) {
    case "properties":
      return prisma.property.count({ where: { tenantId } });
    case "users":
      return prisma.tenantMembership.count({
        where: { tenantId, status: "active" },
      });
    case "residents":
      return prisma.resident.count({ where: { tenantId } });
    case "tokens_monthly":
      return prisma.token.count({
        where: { tenantId, createdAt: { gte: monthStart } },
      });
    default:
      return 0;
  }
}

export async function assertWithinLimit(
  tenant: TenantLike,
  resource: LimitResource
): Promise<{ ok: true } | { ok: false; message: string }> {
  const limit = getLimit(tenant, resource);
  if (limit === null) return { ok: true };

  const usage = await countUsage(tenant.id, resource);
  if (usage >= limit) {
    const labels: Record<LimitResource, string> = {
      properties: "residenciales",
      users: "usuarios",
      residents: "residentes",
      tokens_monthly: "tokens este mes",
    };
    return {
      ok: false,
      message: `Límite del plan alcanzado (${limit} ${labels[resource]})`,
    };
  }
  return { ok: true };
}

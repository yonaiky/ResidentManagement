import type { TenantContext } from "./types";

export function mergeTenantWhere<T extends Record<string, unknown>>(
  where: T,
  ctx: TenantContext
): T & { tenantId: string } {
  return { ...where, tenantId: ctx.tenantId };
}

export function mergePropertyWhere<T extends Record<string, unknown>>(
  where: T,
  ctx: TenantContext,
  propertyField = "propertyId"
): T {
  if (!ctx.propertyId) return where;
  return { ...where, [propertyField]: ctx.propertyId };
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isTechnician } from "@/lib/roles";
import { requireTenantAuth, requireTenantManager } from "@/lib/tenant/auth";
import type { AuthTenantUser } from "@/lib/tenant/types";
import { mergeTenantWhere } from "@/lib/tenant/scope";

export async function requireTicketAuth(): Promise<
  AuthTenantUser | NextResponse
> {
  return requireTenantAuth("user");
}

export async function requireAuth(
  minRole: "user" | "manager" | "admin" = "user"
): Promise<AuthTenantUser | NextResponse> {
  if (minRole === "admin") {
    return requireTenantAuth("tenant_admin");
  }
  if (minRole === "manager") {
    return requireTenantManager();
  }
  return requireTicketAuth();
}

export function mergeTicketListScope(
  where: Record<string, unknown>,
  auth: AuthTenantUser
): Record<string, unknown> {
  const scoped = mergeTenantWhere(where, auth.ctx);
  if (isTechnician(auth.ctx.membershipRole)) {
    return { ...scoped, assignedToId: auth.userId };
  }
  return scoped;
}

export function canAccessTicket(
  ticket: { assignedToId: string | null },
  auth: AuthTenantUser
): boolean {
  if (!isTechnician(auth.ctx.membershipRole)) {
    return true;
  }
  return ticket.assignedToId === auth.userId;
}

export async function findTicketWithAccess(
  ticketId: number,
  auth: AuthTenantUser
) {
  const ticket = await prisma.maintenanceTicket.findFirst({
    where: { id: ticketId, tenantId: auth.ctx.tenantId },
  });
  if (!ticket) return null;
  if (!canAccessTicket(ticket, auth)) return null;
  return ticket;
}

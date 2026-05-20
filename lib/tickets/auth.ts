import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, hasPermission, type AuthUser } from "@/lib/auth";
import { isTechnician } from "@/lib/roles";

export async function requireTicketAuth(): Promise<
  { user: AuthUser } | NextResponse
> {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isTechnician(user.role) || hasPermission(user.role, "user")) {
    return { user };
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function requireAuth(
  minRole: "user" | "manager" | "admin" = "user"
): Promise<{ user: AuthUser } | NextResponse> {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isTechnician(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!hasPermission(user.role, minRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return { user };
}

export function mergeTicketListScope(
  where: Record<string, unknown>,
  user: AuthUser
): Record<string, unknown> {
  if (!isTechnician(user.role)) {
    return where;
  }
  return {
    ...where,
    assignedToId: user.userId,
  };
}

export function canAccessTicket(
  ticket: { assignedToId: string | null },
  user: AuthUser
): boolean {
  if (!isTechnician(user.role)) {
    return true;
  }
  return ticket.assignedToId === user.userId;
}

export async function findTicketWithAccess(
  ticketId: number,
  user: AuthUser
) {
  const ticket = await prisma.maintenanceTicket.findUnique({
    where: { id: ticketId },
  });
  if (!ticket) return null;
  if (!canAccessTicket(ticket, user)) return null;
  return ticket;
}

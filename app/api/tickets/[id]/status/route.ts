import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  findTicketWithAccess,
  requireAuth,
  requireTicketAuth,
} from "@/lib/tickets/auth";
import { isTechnician } from "@/lib/roles";
import {
  canTechnicianTransition,
  canTransition,
  isTerminalStatus,
  requiresManagerForTransition,
} from "@/lib/tickets/status";
import { isSlaBreached } from "@/lib/tickets/sla";
import { writeAuditLog } from "@/lib/audit/log";
import { emitOpsEvent, OPS_EVENTS } from "@/lib/operations/events";
import { serializeTicketDetail } from "@/lib/tickets/serialize";

function parseId(id: string): number | null {
  const n = parseInt(id, 10);
  return Number.isNaN(n) ? null : n;
}

const detailInclude = {
  resident: true,
  createdBy: { select: { id: true, username: true, email: true } },
  assignedTo: { select: { id: true, username: true, email: true } },
  _count: { select: { comments: true } },
  statusHistory: { orderBy: { createdAt: "asc" as const } },
  comments: {
    orderBy: { createdAt: "asc" as const },
    include: {
      author: { select: { id: true, username: true, email: true } },
    },
  },
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ticketId = parseId(params.id);
  if (ticketId == null) {
    return NextResponse.json({ error: "Invalid ticket id" }, { status: 400 });
  }

  const ticketAuth = await requireTicketAuth();
  if (ticketAuth instanceof NextResponse) return ticketAuth;

  const asTechnician = isTechnician(ticketAuth.ctx.membershipRole);

  if (!asTechnician) {
    const managerAuth = await requireAuth("manager");
    if (managerAuth instanceof NextResponse) return managerAuth;
  }

  try {
    const { status, note } = (await request.json()) as {
      status?: string;
      note?: string;
    };

    if (!status) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    if (!asTechnician && requiresManagerForTransition(status)) {
      const adminAuth = await requireAuth("admin");
      if (adminAuth instanceof NextResponse) return adminAuth;
    }

    const existing = await findTicketWithAccess(ticketId, ticketAuth);
    if (!existing) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (isTerminalStatus(existing.status) && existing.status !== "closed") {
      return NextResponse.json(
        { error: "Cannot change status of a closed ticket" },
        { status: 400 }
      );
    }

    // Reapertura desde closed
    if (existing.status === "closed" && status !== "open" && status !== "in_progress") {
      return NextResponse.json(
        { error: "Desde cerrado solo se puede reabrir a open o in_progress" },
        { status: 400 }
      );
    }

    const validTransition = asTechnician
      ? canTechnicianTransition(existing.status, status)
      : canTransition(existing.status, status);

    if (!validTransition) {
      return NextResponse.json(
        { error: `Invalid transition from ${existing.status} to ${status}` },
        { status: 400 }
      );
    }

    if (asTechnician && (status === "cancelled" || status === "closed")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const updateData: Record<string, unknown> = {
      status,
      slaBreached: isSlaBreached(existing.slaDueAt, status, now),
    };

    if (status === "resolved") {
      updateData.resolvedAt = now;
    }
    if (status === "closed") {
      updateData.closedAt = now;
      if (!existing.resolvedAt) updateData.resolvedAt = now;
    }

    const ticket = await prisma.$transaction(async (tx) => {
      await tx.ticketStatusHistory.create({
        data: {
          ticketId,
          fromStatus: existing.status,
          toStatus: status,
          changedById: ticketAuth.userId,
          note: note?.trim() || null,
        },
      });

      return tx.maintenanceTicket.update({
        where: { id: ticketId },
        data: updateData,
        include: detailInclude,
      });
    });

    if (status === "resolved") {
      await emitOpsEvent({
        tenantId: ticketAuth.ctx.tenantId,
        organizationId: existing.organizationId,
        userId: ticketAuth.userId,
        event: OPS_EVENTS.TicketResolved,
        entity: "MaintenanceTicket",
        entityId: String(ticketId),
      });
    }
    if (status === "closed") {
      await emitOpsEvent({
        tenantId: ticketAuth.ctx.tenantId,
        organizationId: existing.organizationId,
        userId: ticketAuth.userId,
        event: OPS_EVENTS.TicketClosed,
        entity: "MaintenanceTicket",
        entityId: String(ticketId),
      });
    }

    await writeAuditLog({
      tenantId: ticketAuth.ctx.tenantId,
      organizationId: existing.organizationId,
      userId: ticketAuth.userId,
      action: "status_change",
      entity: "MaintenanceTicket",
      entityId: String(ticketId),
      previousValues: { status: existing.status },
      newValues: { status },
    });

    return NextResponse.json(serializeTicketDetail(ticket));
  } catch (error) {
    console.error("PATCH /api/tickets/[id]/status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

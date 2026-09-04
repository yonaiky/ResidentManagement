import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tickets/auth";
import { isTerminalStatus } from "@/lib/tickets/status";
import { emitOpsEvent, OPS_EVENTS } from "@/lib/operations/events";
import { serializeTicketDetail } from "@/lib/tickets/serialize";

function parseId(id: string): number | null {
  const n = parseInt(id, 10);
  return Number.isNaN(n) ? null : n;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth("manager");
  if (auth instanceof NextResponse) return auth;

  const ticketId = parseId(params.id);
  if (ticketId == null) {
    return NextResponse.json({ error: "Invalid ticket id" }, { status: 400 });
  }

  try {
    const { assignedToId, note } = (await request.json()) as {
      assignedToId?: string | null;
      note?: string;
    };

    const existing = await prisma.maintenanceTicket.findFirst({
      where: { id: ticketId, tenantId: auth.ctx.tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (isTerminalStatus(existing.status)) {
      return NextResponse.json(
        { error: "Cannot assign a closed ticket" },
        { status: 400 }
      );
    }

    if (assignedToId) {
      const assignee = await prisma.profile.findUnique({
        where: { id: assignedToId },
      });
      if (!assignee || !assignee.isActive) {
        return NextResponse.json({ error: "Assignee not found or inactive" }, { status: 404 });
      }
    }

    const nextStatus =
      assignedToId && existing.status === "open" ? "assigned" : existing.status;

    const ticket = await prisma.$transaction(async (tx) => {
      if (nextStatus !== existing.status) {
        await tx.ticketStatusHistory.create({
          data: {
            ticketId,
            fromStatus: existing.status,
            toStatus: nextStatus,
            changedById: auth.userId,
            note: note?.trim() || "Técnico asignado",
          },
        });
      }

      return tx.maintenanceTicket.update({
        where: { id: ticketId },
        data: {
          assignedToId: assignedToId ?? null,
          status: nextStatus,
        },
        include: {
          resident: true,
          createdBy: { select: { id: true, username: true, email: true } },
          assignedTo: { select: { id: true, username: true, email: true } },
          _count: { select: { comments: true } },
          statusHistory: { orderBy: { createdAt: "asc" } },
          comments: {
            orderBy: { createdAt: "asc" },
            include: {
              author: { select: { id: true, username: true, email: true } },
            },
          },
        },
      });
    });

    await emitOpsEvent({
      tenantId: auth.ctx.tenantId,
      organizationId: existing.organizationId,
      userId: auth.userId,
      event: OPS_EVENTS.TicketAssigned,
      entity: "MaintenanceTicket",
      entityId: String(ticketId),
      payload: { assignedToId: assignedToId ?? null },
    });

    return NextResponse.json(serializeTicketDetail(ticket));
  } catch (error) {
    console.error("PATCH /api/tickets/[id]/assign error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

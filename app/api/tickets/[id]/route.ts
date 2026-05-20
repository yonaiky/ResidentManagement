import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findTicketWithAccess, requireTicketAuth } from "@/lib/tickets/auth";
import { isTechnician } from "@/lib/roles";
import { computeSlaDueAt, isSlaBreached } from "@/lib/tickets/sla";
import { serializeTicketDetail } from "@/lib/tickets/serialize";
import type { UpdateTicketInput } from "@/lib/tickets/types";

function parseId(id: string): number | null {
  const n = parseInt(id, 10);
  return Number.isNaN(n) ? null : n;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireTicketAuth();
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const ticketId = parseId(params.id);
  if (ticketId == null) {
    return NextResponse.json({ error: "Invalid ticket id" }, { status: 400 });
  }

  try {
    const accessCheck = await findTicketWithAccess(ticketId, user);
    if (!accessCheck) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const ticket = await prisma.maintenanceTicket.findUnique({
      where: { id: ticketId },
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

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json(serializeTicketDetail(ticket));
  } catch (error) {
    console.error("GET /api/tickets/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireTicketAuth();
  if (auth instanceof NextResponse) return auth;
  if (isTechnician(auth.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ticketId = parseId(params.id);
  if (ticketId == null) {
    return NextResponse.json({ error: "Invalid ticket id" }, { status: 400 });
  }

  try {
    const existing = await findTicketWithAccess(ticketId, auth.user);
    if (!existing) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const body = (await request.json()) as UpdateTicketInput;
    const { title, description, category, priority, location, residentId } = body;

    if (residentId != null) {
      const resident = await prisma.resident.findUnique({ where: { id: residentId } });
      if (!resident) {
        return NextResponse.json({ error: "Resident not found" }, { status: 404 });
      }
    }

    const nextCategory = category ?? existing.category;
    const nextPriority = priority ?? existing.priority;
    const slaDueAt =
      category || priority
        ? await computeSlaDueAt(nextCategory, nextPriority, existing.createdAt)
        : existing.slaDueAt;

    const slaBreached = isSlaBreached(slaDueAt, existing.status);

    const ticket = await prisma.maintenanceTicket.update({
      where: { id: ticketId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(category !== undefined && { category }),
        ...(priority !== undefined && { priority }),
        ...(location !== undefined && { location: location?.trim() || null }),
        ...(residentId !== undefined && { residentId }),
        slaDueAt,
        slaBreached,
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

    return NextResponse.json(serializeTicketDetail(ticket));
  } catch (error) {
    console.error("PATCH /api/tickets/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

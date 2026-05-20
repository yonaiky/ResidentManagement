import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mergeTicketListScope, requireTicketAuth } from "@/lib/tickets/auth";
import { isTechnician } from "@/lib/roles";
import { DEFAULT_PRIORITY, DEFAULT_STATUS } from "@/lib/tickets/constants";
import {
  buildTicketOrderBy,
  buildTicketWhereClause,
  parseTicketSearchParams,
} from "@/lib/tickets/filters";
import { generateTicketNumber } from "@/lib/tickets/number";
import { computeSlaDueAt } from "@/lib/tickets/sla";
import { serializeTicketListItem } from "@/lib/tickets/serialize";
import type { CreateTicketInput } from "@/lib/tickets/types";

const ticketInclude = {
  resident: true,
  createdBy: { select: { id: true, username: true, email: true } },
  assignedTo: { select: { id: true, username: true, email: true } },
  _count: { select: { comments: true } },
} as const;

export async function GET(request: NextRequest) {
  const auth = await requireTicketAuth();
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  try {
    const filters = parseTicketSearchParams(request.nextUrl.searchParams);
    const where = mergeTicketListScope(
      buildTicketWhereClause(filters),
      user
    );
    const orderBy = buildTicketOrderBy(filters);
    const skip = (filters.page - 1) * filters.pageSize;

    const [total, tickets] = await Promise.all([
      prisma.maintenanceTicket.count({ where }),
      prisma.maintenanceTicket.findMany({
        where,
        orderBy,
        skip,
        take: filters.pageSize,
        include: ticketInclude,
      }),
    ]);

    const items = tickets.map(serializeTicketListItem);

    return NextResponse.json({
      items,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(total / filters.pageSize) || 1,
    });
  } catch (error) {
    console.error("GET /api/tickets error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireTicketAuth();
  if (auth instanceof NextResponse) return auth;
  if (isTechnician(auth.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { user } = auth;

  try {
    const body = (await request.json()) as CreateTicketInput;
    const { title, description, category, priority, location, residentId } = body;

    if (!title?.trim() || !description?.trim() || !category) {
      return NextResponse.json(
        { error: "title, description and category are required" },
        { status: 400 }
      );
    }

    if (residentId != null) {
      const resident = await prisma.resident.findUnique({ where: { id: residentId } });
      if (!resident) {
        return NextResponse.json({ error: "Resident not found" }, { status: 404 });
      }
    }

    const createdAt = new Date();
    const ticketNumber = await generateTicketNumber(createdAt);
    const ticketPriority = priority ?? DEFAULT_PRIORITY;
    const slaDueAt = await computeSlaDueAt(category, ticketPriority, createdAt);

    const ticket = await prisma.$transaction(async (tx) => {
      const created = await tx.maintenanceTicket.create({
        data: {
          ticketNumber,
          title: title.trim(),
          description: description.trim(),
          category,
          priority: ticketPriority,
          status: DEFAULT_STATUS,
          location: location?.trim() || null,
          residentId: residentId ?? null,
          createdById: user.userId,
          slaDueAt,
          slaBreached: false,
        },
        include: ticketInclude,
      });

      await tx.ticketStatusHistory.create({
        data: {
          ticketId: created.id,
          fromStatus: null,
          toStatus: DEFAULT_STATUS,
          changedById: user.userId,
          note: "Ticket creado",
        },
      });

      return created;
    });

    return NextResponse.json(serializeTicketListItem(ticket), { status: 201 });
  } catch (error) {
    console.error("POST /api/tickets error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

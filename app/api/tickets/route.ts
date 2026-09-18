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
import { resolveOrganizationId } from "@/lib/finance/org";
import { emitOpsEvent, OPS_EVENTS } from "@/lib/operations/events";
import { z } from "zod";
import { parseJsonBody } from "@/lib/validation/http";
import {
  ticketCategorySchema,
  ticketPrioritySchema,
} from "@/lib/validation/enums";
import { optionalLongText, shortText } from "@/lib/validation/common";

const createTicketSchema = z.object({
  title: shortText,
  description: optionalLongText.min(1),
  category: ticketCategorySchema,
  priority: ticketPrioritySchema.optional(),
  location: shortText.nullable().optional(),
  residentId: z.coerce.number().int().positive().nullable().optional(),
  providerId: z.string().min(1).nullable().optional(),
});

const ticketInclude = {
  resident: true,
  createdBy: { select: { id: true, username: true, email: true } },
  assignedTo: { select: { id: true, username: true, email: true } },
  _count: { select: { comments: true } },
} as const;

export async function GET(request: NextRequest) {
  const auth = await requireTicketAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const filters = parseTicketSearchParams(request.nextUrl.searchParams);
    const where = mergeTicketListScope(buildTicketWhereClause(filters), auth);
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

    return NextResponse.json({
      items: tickets.map(serializeTicketListItem),
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
  if (isTechnician(auth.ctx.effectiveRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const org = await resolveOrganizationId(auth);
  if (org instanceof NextResponse) return org;

  try {
    const parsed = await parseJsonBody(request, createTicketSchema);
    if (!parsed.ok) return parsed.response;
    const {
      title,
      description,
      category,
      priority,
      location,
      residentId,
      providerId,
    } = parsed.data;

    if (residentId != null) {
      const resident = await prisma.resident.findFirst({
        where: { id: residentId, tenantId: auth.ctx.tenantId },
      });
      if (!resident) {
        return NextResponse.json({ error: "Resident not found" }, { status: 404 });
      }
    }

    if (providerId) {
      const provider = await prisma.provider.findFirst({
        where: {
          id: providerId,
          tenantId: auth.ctx.tenantId,
          organizationId: org.organizationId,
          status: "ACTIVE",
        },
      });
      if (!provider) {
        return NextResponse.json({ error: "Provider not found" }, { status: 404 });
      }
    }

    const createdAt = new Date();
    const ticketNumber = await generateTicketNumber(auth.ctx.tenantId, createdAt);
    const ticketPriority = priority ?? DEFAULT_PRIORITY;
    const slaDueAt = await computeSlaDueAt(
      auth.ctx.tenantId,
      category,
      ticketPriority,
      createdAt
    );

    const ticket = await prisma.$transaction(async (tx) => {
      const created = await tx.maintenanceTicket.create({
        data: {
          tenantId: auth.ctx.tenantId,
          organizationId: org.organizationId,
          propertyId: auth.ctx.propertyId,
          providerId: providerId ?? null,
          ticketNumber,
          title: title.trim(),
          description: description.trim(),
          category,
          priority: ticketPriority,
          status: DEFAULT_STATUS,
          location: location?.trim() || null,
          residentId: residentId ?? null,
          createdById: auth.userId,
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
          changedById: auth.userId,
          note: "Ticket creado",
        },
      });

      return created;
    });

    await emitOpsEvent({
      tenantId: auth.ctx.tenantId,
      organizationId: org.organizationId,
      userId: auth.userId,
      event: OPS_EVENTS.TicketCreated,
      entity: "MaintenanceTicket",
      entityId: String(ticket.id),
      payload: { ticketNumber: ticket.ticketNumber, priority: ticket.priority },
    });

    return NextResponse.json(serializeTicketListItem(ticket), { status: 201 });
  } catch (error) {
    console.error("POST /api/tickets error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

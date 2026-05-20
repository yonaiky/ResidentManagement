import type {
  MaintenanceTicket,
  Profile,
  Resident,
  TicketComment,
  TicketStatusHistory,
} from "@prisma/client";
import { getSlaDisplayStatus } from "./sla";
import type {
  TicketCommentItem,
  TicketDetail,
  TicketListItem,
  TicketResidentSummary,
  TicketStatusHistoryItem,
  TicketUserSummary,
} from "./types";

type TicketWithRelations = MaintenanceTicket & {
  resident: Resident | null;
  createdBy: Pick<Profile, "id" | "username" | "email">;
  assignedTo: Pick<Profile, "id" | "username" | "email"> | null;
  _count?: { comments: number };
};

type TicketDetailWithRelations = TicketWithRelations & {
  statusHistory: TicketStatusHistory[];
  comments: (TicketComment & {
    author: Pick<Profile, "id" | "username" | "email">;
  })[];
};

function toUserSummary(
  profile: Pick<Profile, "id" | "username" | "email">
): TicketUserSummary {
  return {
    id: profile.id,
    username: profile.username,
    email: profile.email,
  };
}

function toResidentSummary(resident: Resident): TicketResidentSummary {
  return {
    id: resident.id,
    name: resident.name,
    lastName: resident.lastName,
    address: resident.address,
    phone: resident.phone,
  };
}

export function serializeTicketListItem(ticket: TicketWithRelations): TicketListItem {
  const slaStatus = getSlaDisplayStatus(
    ticket.slaDueAt,
    ticket.slaBreached,
    ticket.status,
    ticket.createdAt
  );

  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    title: ticket.title,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    location: ticket.location,
    slaDueAt: ticket.slaDueAt?.toISOString() ?? null,
    slaBreached: ticket.slaBreached,
    slaStatus,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    resident: ticket.resident ? toResidentSummary(ticket.resident) : null,
    assignedTo: ticket.assignedTo ? toUserSummary(ticket.assignedTo) : null,
    createdBy: toUserSummary(ticket.createdBy),
    commentCount: ticket._count?.comments ?? 0,
  };
}

export function serializeTicketDetail(ticket: TicketDetailWithRelations): TicketDetail {
  const base = serializeTicketListItem(ticket);

  const statusHistory: TicketStatusHistoryItem[] = ticket.statusHistory.map((h) => ({
    id: h.id,
    fromStatus: h.fromStatus,
    toStatus: h.toStatus,
    note: h.note,
    createdAt: h.createdAt.toISOString(),
    changedById: h.changedById,
  }));

  const comments: TicketCommentItem[] = ticket.comments.map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
    author: toUserSummary(c.author),
  }));

  return {
    ...base,
    description: ticket.description,
    resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
    closedAt: ticket.closedAt?.toISOString() ?? null,
    statusHistory,
    comments,
  };
}

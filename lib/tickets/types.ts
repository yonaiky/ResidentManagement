import type { TicketCategory, TicketPriority, TicketStatus } from "./constants";

export type TicketsFilters = {
  status: string;
  priority: string;
  category: string;
  assignedToId: string;
  unassigned: boolean;
  residentId: string;
  search: string;
  slaBreached: boolean;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
  sortBy: "createdAt" | "slaDueAt" | "priority";
  sortOrder: "asc" | "desc";
};

export type TicketUserSummary = {
  id: string;
  username: string;
  email: string;
};

export type TicketResidentSummary = {
  id: number;
  name: string;
  lastName: string;
  address: string;
  phone: string;
};

export type TicketListItem = {
  id: number;
  ticketNumber: string;
  title: string;
  category: TicketCategory | string;
  priority: TicketPriority | string;
  status: TicketStatus | string;
  location: string | null;
  slaDueAt: string | null;
  slaBreached: boolean;
  slaStatus: "ok" | "warning" | "breached" | "none";
  createdAt: string;
  updatedAt: string;
  resident: TicketResidentSummary | null;
  assignedTo: TicketUserSummary | null;
  createdBy: TicketUserSummary;
  commentCount: number;
};

export type TicketStatusHistoryItem = {
  id: number;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  createdAt: string;
  changedById: string;
};

export type TicketCommentItem = {
  id: number;
  body: string;
  createdAt: string;
  author: TicketUserSummary;
};

export type TicketDetail = TicketListItem & {
  description: string;
  resolvedAt: string | null;
  closedAt: string | null;
  statusHistory: TicketStatusHistoryItem[];
  comments: TicketCommentItem[];
};

export type TicketsListResponse = {
  items: TicketListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type CreateTicketInput = {
  title: string;
  description: string;
  category: string;
  priority?: string;
  location?: string;
  residentId?: number | null;
};

export type UpdateTicketInput = {
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  location?: string;
  residentId?: number | null;
};

export type TicketsDashboardStats = {
  openCount: number;
  unassignedCount: number;
  slaBreachedCount: number;
  inProgressCount: number;
};

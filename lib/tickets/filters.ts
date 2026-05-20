import type { TicketsFilters } from "./types";

export function parseTicketSearchParams(
  searchParams: URLSearchParams
): TicketsFilters {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10) || 20)
  );

  const sortByParam = searchParams.get("sortBy");
  const sortBy: TicketsFilters["sortBy"] =
    sortByParam === "slaDueAt" || sortByParam === "priority"
      ? sortByParam
      : "createdAt";

  const sortOrderParam = searchParams.get("sortOrder");
  const sortOrder: TicketsFilters["sortOrder"] =
    sortOrderParam === "asc" ? "asc" : "desc";

  return {
    status: searchParams.get("status") ?? "",
    priority: searchParams.get("priority") ?? "",
    category: searchParams.get("category") ?? "",
    assignedToId: searchParams.get("assignedToId") ?? "",
    unassigned: searchParams.get("unassigned") === "true",
    residentId: searchParams.get("residentId") ?? "",
    search: searchParams.get("search") ?? "",
    slaBreached: searchParams.get("slaBreached") === "true",
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    page,
    pageSize,
    sortBy,
    sortOrder,
  };
}

export function buildTicketWhereClause(filters: TicketsFilters) {
  const where: Record<string, unknown> = {};

  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.category) where.category = filters.category;
  if (filters.assignedToId) where.assignedToId = filters.assignedToId;
  if (filters.unassigned) where.assignedToId = null;
  if (filters.residentId) {
    const id = parseInt(filters.residentId, 10);
    if (!Number.isNaN(id)) where.residentId = id;
  }
  if (filters.slaBreached) where.slaBreached = true;

  if (filters.from || filters.to) {
    const createdAt: Record<string, Date> = {};
    if (filters.from) createdAt.gte = new Date(filters.from);
    if (filters.to) {
      const end = new Date(filters.to);
      end.setHours(23, 59, 59, 999);
      createdAt.lte = end;
    }
    where.createdAt = createdAt;
  }

  if (filters.search.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { ticketNumber: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}

export function filtersToSearchParams(filters: TicketsFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.category) params.set("category", filters.category);
  if (filters.assignedToId) params.set("assignedToId", filters.assignedToId);
  if (filters.unassigned) params.set("unassigned", "true");
  if (filters.residentId) params.set("residentId", filters.residentId);
  if (filters.search) params.set("search", filters.search);
  if (filters.slaBreached) params.set("slaBreached", "true");
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.page > 1) params.set("page", String(filters.page));
  if (filters.pageSize !== 20) params.set("pageSize", String(filters.pageSize));
  if (filters.sortBy !== "createdAt") params.set("sortBy", filters.sortBy);
  if (filters.sortOrder !== "desc") params.set("sortOrder", filters.sortOrder);
  return params;
}

export function buildTicketOrderBy(filters: TicketsFilters) {
  if (filters.sortBy === "priority") {
    return { priority: filters.sortOrder };
  }
  if (filters.sortBy === "slaDueAt") {
    return { slaDueAt: filters.sortOrder };
  }
  return { createdAt: filters.sortOrder };
}

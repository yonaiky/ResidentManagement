import type { TicketStatus } from "./constants";

const TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  open: ["assigned", "in_progress", "cancelled"],
  assigned: ["in_progress", "waiting", "open", "cancelled"],
  in_progress: ["waiting", "resolved", "assigned", "cancelled"],
  waiting: ["in_progress", "resolved", "cancelled"],
  resolved: ["closed", "in_progress"],
  closed: ["open", "in_progress"],
  cancelled: [],
};

export function canTransition(from: string, to: string): boolean {
  const allowed = TRANSITIONS[from as TicketStatus];
  if (!allowed) return false;
  return allowed.includes(to as TicketStatus);
}

export function isTerminalStatus(status: string): boolean {
  return status === "closed" || status === "cancelled";
}

export function requiresManagerForTransition(to: string): boolean {
  return to === "cancelled";
}

export function requiresManagerForAssign(): boolean {
  return true;
}

/** Transiciones permitidas para técnicos en tickets asignados a ellos */
const TECHNICIAN_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  open: [],
  assigned: ["in_progress", "waiting"],
  in_progress: ["waiting", "resolved"],
  waiting: ["in_progress", "resolved"],
  resolved: [],
  closed: [],
  cancelled: [],
};

export function canTechnicianTransition(from: string, to: string): boolean {
  const allowed = TECHNICIAN_TRANSITIONS[from as TicketStatus];
  if (!allowed) return false;
  return allowed.includes(to as TicketStatus);
}

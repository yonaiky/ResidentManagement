export const TICKET_CATEGORIES = [
  { value: "plumbing", label: "Plomería / Agua" },
  { value: "electrical", label: "Electricidad" },
  { value: "elevator", label: "Ascensor" },
  { value: "security", label: "Seguridad" },
  { value: "cleaning", label: "Limpieza" },
  { value: "parking", label: "Parqueo" },
  { value: "other", label: "Otro" },
] as const;

export const TICKET_PRIORITIES = [
  { value: "low", label: "Baja", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  { value: "medium", label: "Media", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { value: "high", label: "Alta", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  { value: "urgent", label: "Urgente", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
] as const;

export const TICKET_STATUSES = [
  { value: "open", label: "Abierto", color: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300" },
  { value: "assigned", label: "Asignado", color: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300" },
  { value: "in_progress", label: "En progreso", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300" },
  { value: "waiting", label: "En espera", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300" },
  { value: "resolved", label: "Resuelto", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  { value: "closed", label: "Cerrado", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  { value: "cancelled", label: "Cancelado", color: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500" },
] as const;

export type TicketCategory = (typeof TICKET_CATEGORIES)[number]["value"];
export type TicketPriority = (typeof TICKET_PRIORITIES)[number]["value"];
export type TicketStatus = (typeof TICKET_STATUSES)[number]["value"];

export const DEFAULT_PRIORITY: TicketPriority = "medium";
export const DEFAULT_STATUS: TicketStatus = "open";

export const CLOSED_STATUSES: TicketStatus[] = ["closed", "cancelled", "resolved"];

/** Columnas del tablero Kanban (orden de flujo operativo) */
export const BOARD_COLUMN_STATUSES = [
  "open",
  "assigned",
  "in_progress",
  "waiting",
  "resolved",
  "closed",
] as const;

export type BoardColumnStatus = (typeof BOARD_COLUMN_STATUSES)[number];

export const BOARD_CANCELLED_STATUS = "cancelled" as const;

export const PRIORITY_BORDER_COLORS: Record<string, string> = {
  low: "border-l-slate-400",
  medium: "border-l-blue-500",
  high: "border-l-amber-500",
  urgent: "border-l-red-500",
};

export const DEFAULT_SLA_HOURS = 48;

export function getCategoryLabel(value: string): string {
  return TICKET_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function getPriorityLabel(value: string): string {
  return TICKET_PRIORITIES.find((p) => p.value === value)?.label ?? value;
}

export function getStatusLabel(value: string): string {
  return TICKET_STATUSES.find((s) => s.value === value)?.label ?? value;
}

export function getPriorityColor(value: string): string {
  return TICKET_PRIORITIES.find((p) => p.value === value)?.color ?? "";
}

export function getStatusColor(value: string): string {
  return TICKET_STATUSES.find((s) => s.value === value)?.color ?? "";
}

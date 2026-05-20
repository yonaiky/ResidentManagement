import {
  BOARD_CANCELLED_STATUS,
  BOARD_COLUMN_STATUSES,
  type BoardColumnStatus,
  type TicketStatus,
} from "./constants";
import type { TicketListItem } from "./types";

export type TicketsByStatus = Record<string, TicketListItem[]>;

export function getBoardColumnStatuses(includeCancelled: boolean): string[] {
  const cols: string[] = [...BOARD_COLUMN_STATUSES];
  if (includeCancelled) {
    cols.push(BOARD_CANCELLED_STATUS);
  }
  return cols;
}

export function groupTicketsByStatus(
  items: TicketListItem[],
  columnStatuses: string[]
): TicketsByStatus {
  const grouped: TicketsByStatus = {};
  for (const status of columnStatuses) {
    grouped[status] = [];
  }

  for (const ticket of items) {
    const status = ticket.status;
    if (grouped[status]) {
      grouped[status].push(ticket);
    } else if (columnStatuses.includes(status)) {
      grouped[status] = [ticket];
    }
  }

  return grouped;
}

export function isBoardColumnStatus(status: string): status is BoardColumnStatus {
  return (BOARD_COLUMN_STATUSES as readonly string[]).includes(status);
}

export function ticketDragId(ticketId: number): string {
  return `ticket-${ticketId}`;
}

export function parseTicketDragId(id: string): number | null {
  if (!id.startsWith("ticket-")) return null;
  const n = parseInt(id.slice(7), 10);
  return Number.isNaN(n) ? null : n;
}

export function columnDropId(status: string): string {
  return `column-${status}`;
}

export function parseColumnDropId(id: string): TicketStatus | null {
  if (!id.startsWith("column-")) return null;
  return id.slice(7) as TicketStatus;
}

"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { getCategoryLabel, PRIORITY_BORDER_COLORS } from "@/lib/tickets/constants";
import { ticketDragId } from "@/lib/tickets/board";
import type { TicketListItem } from "@/lib/tickets/types";
import { TicketPriorityBadge } from "@/components/tickets/ticket-priority-badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, MessageSquare, User } from "lucide-react";

type Props = {
  ticket: TicketListItem;
  draggable: boolean;
  isDragging?: boolean;
};

export function TicketBoardCard({ ticket, draggable, isDragging }: Props) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: ticketDragId(ticket.id),
    disabled: !draggable,
    data: { ticket, status: ticket.status },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const borderColor =
    PRIORITY_BORDER_COLORS[ticket.priority] ?? "border-l-muted-foreground";

  const showSlaAlert =
    ticket.slaStatus === "breached" || ticket.slaStatus === "warning";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border border-l-4 bg-card p-3 shadow-sm transition-shadow",
        borderColor,
        draggable && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40 ring-2 ring-primary/30"
      )}
      {...(draggable ? { ...listeners, ...attributes } : {})}
    >
      <Link
        href={`/tickets/${ticket.id}`}
        className="block space-y-2"
        onClick={(e) => {
          if (isDragging) e.preventDefault();
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="font-mono text-[10px] text-muted-foreground">
            {ticket.ticketNumber}
          </span>
          {showSlaAlert && (
            <AlertTriangle
              className={cn(
                "h-3.5 w-3.5 shrink-0",
                ticket.slaStatus === "breached"
                  ? "text-red-500"
                  : "text-amber-500"
              )}
            />
          )}
        </div>
        <h4 className="line-clamp-2 text-sm font-medium leading-snug">
          {ticket.title}
        </h4>
        <p className="text-xs text-muted-foreground">
          {getCategoryLabel(ticket.category)}
          {ticket.location ? ` · ${ticket.location}` : ""}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TicketPriorityBadge priority={ticket.priority} />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {ticket.commentCount > 0 && (
              <span className="flex items-center gap-0.5">
                <MessageSquare className="h-3 w-3" />
                {ticket.commentCount}
              </span>
            )}
            <span className="flex max-w-[100px] items-center gap-0.5 truncate">
              <User className="h-3 w-3 shrink-0" />
              {ticket.assignedTo?.username ?? "Sin asignar"}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

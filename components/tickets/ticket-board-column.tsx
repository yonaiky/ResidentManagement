"use client";

import { useDroppable } from "@dnd-kit/core";
import { TicketBoardCard } from "@/components/tickets/ticket-board-card";
import { columnDropId } from "@/lib/tickets/board";
import { getStatusColor, getStatusLabel } from "@/lib/tickets/constants";
import type { TicketListItem } from "@/lib/tickets/types";
import { cn } from "@/lib/utils";

type Props = {
  status: string;
  tickets: TicketListItem[];
  draggable: boolean;
  activeDragId: string | null;
};

export function TicketBoardColumn({
  status,
  tickets,
  draggable,
  activeDragId,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnDropId(status),
    data: { status },
  });

  return (
    <div className="flex w-[280px] shrink-0 flex-col rounded-lg bg-muted/30">
      <div
        className={cn(
          "flex items-center justify-between rounded-t-lg border-b px-3 py-2.5",
          getStatusColor(status)
        )}
      >
        <span className="text-sm font-semibold">{getStatusLabel(status)}</span>
        <span className="rounded-full bg-background/80 px-2 py-0.5 text-xs font-medium tabular-nums">
          {tickets.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[120px] flex-1 flex-col gap-2 overflow-y-auto p-2 transition-colors",
          "max-h-[calc(100vh-280px)]",
          isOver && "bg-primary/5 ring-2 ring-inset ring-primary/20"
        )}
      >
        {tickets.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Sin tickets
          </p>
        ) : (
          tickets.map((ticket) => (
            <TicketBoardCard
              key={ticket.id}
              ticket={ticket}
              draggable={draggable}
              isDragging={activeDragId === `ticket-${ticket.id}`}
            />
          ))
        )}
      </div>
    </div>
  );
}

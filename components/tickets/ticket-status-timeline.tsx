"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getStatusLabel } from "@/lib/tickets/constants";
import type { TicketStatusHistoryItem } from "@/lib/tickets/types";
import { ArrowRight } from "lucide-react";

type Props = {
  history: TicketStatusHistoryItem[];
};

export function TicketStatusTimeline({ history }: Props) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Sin historial de estados.</p>
    );
  }

  return (
    <ol className="relative space-y-4 border-l border-border pl-6">
      {history.map((item) => (
        <li key={item.id} className="relative">
          <span className="absolute -left-[1.6rem] top-1 flex h-3 w-3 rounded-full border-2 border-primary bg-background" />
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
              {item.fromStatus ? (
                <>
                  <span>{getStatusLabel(item.fromStatus)}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                </>
              ) : null}
              <span>{getStatusLabel(item.toStatus)}</span>
            </div>
            <time className="text-xs text-muted-foreground">
              {format(new Date(item.createdAt), "PPp", { locale: es })}
            </time>
            {item.note && (
              <p className="text-sm text-muted-foreground">{item.note}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

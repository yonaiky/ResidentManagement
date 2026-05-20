"use client";

import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TicketStatusBadge } from "@/components/tickets/ticket-status-badge";
import { TicketPriorityBadge } from "@/components/tickets/ticket-priority-badge";
import { TicketSlaBadge } from "@/components/tickets/ticket-sla-badge";
import { getCategoryLabel } from "@/lib/tickets/constants";
import type { TicketListItem, TicketsListResponse } from "@/lib/tickets/types";
import { Eye, Loader2 } from "lucide-react";

type Props = {
  data: TicketsListResponse | undefined;
  isLoading: boolean;
  onPageChange: (page: number) => void;
};

export function TicketsTable({ data, isLoading, onPageChange }: Props) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        No hay tickets con los filtros seleccionados.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>SLA</TableHead>
              <TableHead>Asignado</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((ticket) => (
              <TicketRow key={ticket.id} ticket={ticket} />
            ))}
          </TableBody>
        </Table>
      </div>
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {data.total} ticket{data.total !== 1 ? "s" : ""} — página {data.page} de{" "}
            {data.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.page <= 1}
              onClick={() => onPageChange(data.page - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page >= data.totalPages}
              onClick={() => onPageChange(data.page + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function TicketRow({ ticket }: { ticket: TicketListItem }) {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{ticket.ticketNumber}</TableCell>
      <TableCell className="max-w-[200px] truncate font-medium">{ticket.title}</TableCell>
      <TableCell className="text-sm">{getCategoryLabel(ticket.category)}</TableCell>
      <TableCell>
        <TicketPriorityBadge priority={ticket.priority} />
      </TableCell>
      <TableCell>
        <TicketStatusBadge status={ticket.status} />
      </TableCell>
      <TableCell>
        <TicketSlaBadge
          slaStatus={ticket.slaStatus}
          slaDueAt={ticket.slaDueAt}
          slaBreached={ticket.slaBreached}
        />
      </TableCell>
      <TableCell className="text-sm">
        {ticket.assignedTo?.username ?? (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {format(new Date(ticket.createdAt), "dd MMM yyyy", { locale: es })}
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/tickets/${ticket.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}

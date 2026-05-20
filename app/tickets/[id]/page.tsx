"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TicketStatusBadge } from "@/components/tickets/ticket-status-badge";
import { TicketPriorityBadge } from "@/components/tickets/ticket-priority-badge";
import { TicketSlaBadge } from "@/components/tickets/ticket-sla-badge";
import { TicketStatusTimeline } from "@/components/tickets/ticket-status-timeline";
import { TicketComments } from "@/components/tickets/ticket-comments";
import { TicketDetailActions } from "@/components/tickets/ticket-detail-actions";
import { getCategoryLabel } from "@/lib/tickets/constants";
import type { TicketDetail } from "@/lib/tickets/types";
import { ArrowLeft, Loader2, MapPin, User } from "lucide-react";

export default function TicketDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTicket = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/tickets/${id}`);
      if (!res.ok) {
        if (res.status === 404) setError("Ticket no encontrado");
        else setError("Error al cargar el ticket");
        setTicket(null);
        return;
      }
      const data = (await res.json()) as TicketDetail;
      setTicket(data);
    } catch {
      setError("Error de conexión");
      setTicket(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadTicket();
  }, [loadTicket]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/tickets">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <p className="text-muted-foreground">{error ?? "Ticket no encontrado"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
            <Link href="/tickets">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tickets
            </Link>
          </Button>
          <h1 className="page-title">{ticket.title}</h1>
          <p className="font-mono text-sm text-muted-foreground">
            {ticket.ticketNumber}
          </p>
          <div className="flex flex-wrap gap-2">
            <TicketStatusBadge status={ticket.status} />
            <TicketPriorityBadge priority={ticket.priority} />
            <TicketSlaBadge
              slaStatus={ticket.slaStatus}
              slaDueAt={ticket.slaDueAt}
              slaBreached={ticket.slaBreached}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Detalle</CardTitle>
              <CardDescription>
                {getCategoryLabel(ticket.category)} · Creado{" "}
                {format(new Date(ticket.createdAt), "PPp", { locale: es })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
              {ticket.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {ticket.location}
                </div>
              )}
              {ticket.resident && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>
                    {ticket.resident.name} {ticket.resident.lastName} —{" "}
                    {ticket.resident.address} · {ticket.resident.phone}
                  </span>
                </div>
              )}
              <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <p>
                  <span className="font-medium text-foreground">Creado por:</span>{" "}
                  {ticket.createdBy.username}
                </p>
                <p>
                  <span className="font-medium text-foreground">Asignado:</span>{" "}
                  {ticket.assignedTo?.username ?? "Sin asignar"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historial de estados</CardTitle>
            </CardHeader>
            <CardContent>
              <TicketStatusTimeline history={ticket.statusHistory} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comentarios</CardTitle>
            </CardHeader>
            <CardContent>
              <TicketComments
                ticketId={ticket.id}
                comments={ticket.comments}
                onCommentAdded={loadTicket}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
              <CardDescription>Asignar técnico y cambiar estado</CardDescription>
            </CardHeader>
            <CardContent>
              <TicketDetailActions ticket={ticket} onUpdated={loadTicket} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

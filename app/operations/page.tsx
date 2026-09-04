"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

type OpsDash = {
  tickets: { open: number; critical: number; slaBreached: number };
  visitors: { inside: number; today: number };
  reservations: { today: number; pendingApproval: number };
  parking: { total: number; occupied: number; available: number };
  announcements: { id: string; title: string; publishedAt: string | null }[];
  recentActivity: {
    id: string;
    action: string;
    entity: string;
    entityId: string;
    createdAt: string;
  }[];
};

const ACTION_LABEL: Record<string, string> = {
  TicketCreated: "Ticket creado",
  TicketAssigned: "Ticket asignado",
  TicketResolved: "Ticket resuelto",
  TicketClosed: "Ticket cerrado",
  VisitorPreauthorized: "Visitante preautorizado",
  VisitorCheckedIn: "Visitante ingresó",
  VisitorCheckedOut: "Visitante salió",
  ReservationCreated: "Reserva creada",
  ReservationApproved: "Reserva aprobada",
  ReservationRejected: "Reserva rechazada",
  AnnouncementPublished: "Comunicado publicado",
};

export default function OperationsPage() {
  const { toast } = useToast();
  const [data, setData] = useState<OpsDash | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/operations/dashboard");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error");
      setData(json);
    } catch {
      toast({ title: "Error", description: "No se pudo cargar operación" });
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) {
    return <div className="p-6 text-sm text-muted-foreground">Cargando…</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Operación</h1>
        <p className="text-sm text-muted-foreground">
          Resumen diario del residencial
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tickets abiertos</CardDescription>
            <CardTitle className="text-3xl">{data.tickets.open}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {data.tickets.critical} críticos · {data.tickets.slaBreached} SLA vencido
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Visitantes</CardDescription>
            <CardTitle className="text-3xl">{data.visitors.inside}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Dentro ahora · {data.visitors.today} del día
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Reservas</CardDescription>
            <CardTitle className="text-3xl">{data.reservations.today}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Hoy · {data.reservations.pendingApproval} pendientes
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Parqueos</CardDescription>
            <CardTitle className="text-3xl">{data.parking.available}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Disponibles · {data.parking.occupied}/{data.parking.total} ocupados
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actividad reciente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentActivity.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin actividad aún</p>
            )}
            {data.recentActivity.map((a) => (
              <div key={a.id} className="flex gap-3 text-sm">
                <span className="w-14 shrink-0 text-muted-foreground">
                  {new Date(a.createdAt).toLocaleTimeString("es-DO", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span>
                  {ACTION_LABEL[a.action] ?? a.action}{" "}
                  <span className="text-muted-foreground">#{a.entityId}</span>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comunicados recientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.announcements.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Sin comunicados.{" "}
                <Link href="/announcements" className="underline">
                  Crear
                </Link>
              </p>
            )}
            {data.announcements.map((a) => (
              <div key={a.id} className="text-sm">
                {a.title}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

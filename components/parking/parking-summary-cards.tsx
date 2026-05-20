"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, MapPin, Users, AlertTriangle } from "lucide-react";
import type { ParkingOverview } from "@/lib/parking/types";

export function ParkingSummaryCards({ overview }: { overview: ParkingOverview }) {
  const cards = [
    {
      title: "Espacios disponibles",
      value: overview.spots.available,
      sub: `de ${overview.spots.total} totales`,
      icon: MapPin,
      badgeClass: "icon-badge",
      iconClass: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Espacios ocupados",
      value: overview.spots.occupied,
      sub: `${overview.spots.maintenance} en mantenimiento`,
      icon: Car,
      badgeClass: "icon-badge-violet",
      iconClass: "text-amber-600 dark:text-amber-400",
    },
    {
      title: "Visitas activas",
      value: overview.activeVisits,
      sub: `${overview.visitsToday} programadas hoy`,
      icon: Users,
      badgeClass: "icon-badge",
      iconClass: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Multas pendientes",
      value: overview.pendingFines,
      sub: `RD$ ${overview.pendingFinesAmount.toLocaleString("es-DO")}`,
      icon: AlertTriangle,
      badgeClass: "icon-badge-violet",
      iconClass: "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card key={c.title} className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {c.title}
              </CardTitle>
              <div className={c.badgeClass}>
                <Icon className={`h-4 w-4 ${c.iconClass}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.sub}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

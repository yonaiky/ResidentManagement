"use client";

import Link from "next/link";
import { useApiQuery } from "@/hooks/use-api-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ParkingVisitItem, VehicleListItem } from "@/lib/parking/types";
import { getVisitStatusLabel } from "@/lib/parking/constants";
import { Car, ExternalLink } from "lucide-react";
import { format } from "date-fns";

export function ResidentParkingSection({ residentId }: { residentId: number }) {
  const { data: vehiclesData, isLoading: loadingV } = useApiQuery<{
    items: VehicleListItem[];
  }>(`resident-vehicles-${residentId}`, `/api/parking/vehicles?residentId=${residentId}`);

  const { data: visitsData, isLoading: loadingVisits } = useApiQuery<{
    items: ParkingVisitItem[];
  }>(
    `resident-visits-${residentId}`,
    `/api/parking/visits?residentId=${residentId}`
  );

  const vehicles = vehiclesData?.items ?? [];
  const visits = (visitsData?.items ?? []).slice(0, 5);

  if (loadingV && loadingVisits) {
    return <p className="text-sm text-muted-foreground">Cargando parqueo...</p>;
  }

  return (
    <Card className="card-hover">
      <CardHeader className="card-accent-header flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <div className="icon-badge">
              <Car className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            Vehículos y parqueo
          </CardTitle>
          <CardDescription>Placas, parqueo asignado y visitas recientes</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/parking">
            <ExternalLink className="mr-2 h-4 w-4" />
            Ver módulo
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div>
          <h4 className="mb-2 text-sm font-medium">Vehículos registrados</h4>
          {vehicles.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin vehículos registrados.</p>
          ) : (
            <ul className="space-y-2">
              {vehicles.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span className="font-medium">{v.plate}</span>
                  <span className="text-muted-foreground">
                    {v.activeAssignment
                      ? `Parqueo ${v.activeAssignment.spotCode}`
                      : "Sin parqueo"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h4 className="mb-2 text-sm font-medium">Visitas recientes</h4>
          {visits.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin visitas registradas.</p>
          ) : (
            <ul className="space-y-2">
              {visits.map((visit) => (
                <li
                  key={visit.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span>
                    {visit.plate}
                    {visit.visitorName ? ` — ${visit.visitorName}` : ""}
                  </span>
                  <Badge variant="outline">
                    {getVisitStatusLabel(visit.computedStatus)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

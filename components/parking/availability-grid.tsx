"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { AvailabilityBadge } from "@/components/parking/availability-badge";
import type { ParkingSpotItem } from "@/lib/parking/types";
import { getSpotTypeLabel } from "@/lib/parking/constants";

export function AvailabilityGrid({ cacheKey = "parking-availability" }: { cacheKey?: string }) {
  const { data, isLoading } = useApiQuery<{ items: ParkingSpotItem[] }>(
    cacheKey,
    "/api/parking/availability"
  );

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando espacios...</p>;
  }

  const items = data?.items ?? [];
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay espacios registrados. Agrega espacios en la pestaña Espacios.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {items.map((spot) => (
        <div
          key={spot.id}
          className="rounded-lg border border-border bg-card p-3 text-center shadow-sm"
        >
          <p className="font-semibold">{spot.code}</p>
          <p className="text-xs text-muted-foreground">
            {spot.zone ?? getSpotTypeLabel(spot.spotType)}
          </p>
          <div className="mt-2 flex justify-center">
            <AvailabilityBadge availability={spot.computedAvailability} />
          </div>
        </div>
      ))}
    </div>
  );
}

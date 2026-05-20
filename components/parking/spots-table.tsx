"use client";

import { useState } from "react";
import { useApiQuery } from "@/hooks/use-api-query";
import { invalidateCache } from "@/lib/client-fetch-cache";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AvailabilityBadge } from "@/components/parking/availability-badge";
import { SpotFormModal } from "@/components/parking/spot-form-modal";
import { getSpotTypeLabel } from "@/lib/parking/constants";
import type { ParkingSpotItem } from "@/lib/parking/types";
import { useAuthUserStore } from "@/store/auth-user-store";
import { Pencil, Plus } from "lucide-react";

const CACHE_KEY = "parking-spots";

export function SpotsTable() {
  const user = useAuthUserStore((s) => s.user);
  const canManage = user?.role === "admin" || user?.role === "manager";
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editSpot, setEditSpot] = useState<ParkingSpotItem | null>(null);

  const url = search
    ? `/api/parking/spots?search=${encodeURIComponent(search)}`
    : "/api/parking/spots";
  const { data, isLoading, refresh } = useApiQuery<{ items: ParkingSpotItem[] }>(
    `${CACHE_KEY}-${search}`,
    url
  );

  const items = data?.items ?? [];

  const handleSuccess = () => {
    invalidateCache(CACHE_KEY);
    invalidateCache("parking-availability");
    invalidateCache("parking-overview");
    void refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Buscar por código o zona..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        {canManage && (
          <Button
            onClick={() => {
              setEditSpot(null);
              setModalOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo espacio
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Zona</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Disponibilidad</TableHead>
              <TableHead>Asignado a</TableHead>
              {canManage && <TableHead className="w-[80px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((spot) => (
              <TableRow key={spot.id}>
                <TableCell className="font-medium">{spot.code}</TableCell>
                <TableCell>{spot.zone ?? "—"}</TableCell>
                <TableCell>{getSpotTypeLabel(spot.spotType)}</TableCell>
                <TableCell>
                  <AvailabilityBadge availability={spot.computedAvailability} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {spot.activeAssignment
                    ? `${spot.activeAssignment.plate} (${spot.activeAssignment.residentName})`
                    : "—"}
                </TableCell>
                {canManage && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditSpot(spot);
                        setModalOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <SpotFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleSuccess}
        spot={editSpot}
      />
    </div>
  );
}

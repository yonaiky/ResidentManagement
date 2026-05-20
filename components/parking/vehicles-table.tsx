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
import { VehicleFormModal } from "@/components/parking/vehicle-form-modal";
import { AssignParkingModal } from "@/components/parking/assign-parking-modal";
import type { VehicleListItem } from "@/lib/parking/types";
import { useAuthUserStore } from "@/store/auth-user-store";
import { useToast } from "@/components/ui/use-toast";
import { Car, Link2, Plus, XCircle } from "lucide-react";

const CACHE_KEY = "parking-vehicles";

export function VehiclesTable() {
  const { toast } = useToast();
  const user = useAuthUserStore((s) => s.user);
  const canManage = user?.role === "admin" || user?.role === "manager";
  const [vehicleModal, setVehicleModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | undefined>();

  const { data, isLoading, refresh } = useApiQuery<{ items: VehicleListItem[] }>(
    CACHE_KEY,
    "/api/parking/vehicles"
  );

  const items = data?.items ?? [];

  const invalidateAll = () => {
    invalidateCache(CACHE_KEY);
    invalidateCache("parking-spots");
    invalidateCache("parking-availability");
    invalidateCache("parking-overview");
    void refresh();
  };

  async function endAssignment(assignmentId: number) {
    try {
      const res = await fetch(`/api/parking/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Asignación finalizada" });
      invalidateAll();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex gap-2">
          <Button onClick={() => setVehicleModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Registrar vehículo
          </Button>
          <Button variant="outline" onClick={() => setAssignModal(true)}>
            <Link2 className="mr-2 h-4 w-4" />
            Asignar parqueo
          </Button>
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Placa</TableHead>
              <TableHead>Residente</TableHead>
              <TableHead>Vehículo</TableHead>
              <TableHead>Parqueo asignado</TableHead>
              {canManage && <TableHead className="w-[120px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{v.plate}</TableCell>
                <TableCell>
                  {v.resident.name} {v.resident.lastName}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {[v.make, v.model, v.color].filter(Boolean).join(" ") || "—"}
                </TableCell>
                <TableCell>
                  {v.activeAssignment ? (
                    <span className="flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      {v.activeAssignment.spotCode}
                    </span>
                  ) : (
                    "Sin asignar"
                  )}
                </TableCell>
                {canManage && (
                  <TableCell>
                    {v.activeAssignment ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => endAssignment(v.activeAssignment!.id)}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Liberar
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedVehicleId(v.id);
                          setAssignModal(true);
                        }}
                      >
                        Asignar
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <VehicleFormModal
        open={vehicleModal}
        onOpenChange={setVehicleModal}
        onSuccess={invalidateAll}
      />
      <AssignParkingModal
        open={assignModal}
        onOpenChange={setAssignModal}
        onSuccess={invalidateAll}
        preselectedVehicleId={selectedVehicleId}
      />
    </div>
  );
}

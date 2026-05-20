"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import type { ParkingSpotItem, VehicleListItem } from "@/lib/parking/types";
import { Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  preselectedVehicleId?: number;
};

export function AssignParkingModal({
  open,
  onOpenChange,
  onSuccess,
  preselectedVehicleId,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleListItem[]>([]);
  const [spots, setSpots] = useState<ParkingSpotItem[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [spotId, setSpotId] = useState("");

  useEffect(() => {
    if (!open) return;
    Promise.all([
      fetch("/api/parking/vehicles").then((r) => r.json()),
      fetch("/api/parking/spots?availability=available").then((r) => r.json()),
    ])
      .then(([vData, sData]) => {
        setVehicles(vData.items ?? []);
        const available = (sData.items ?? []).filter(
          (s: ParkingSpotItem) => s.computedAvailability === "available"
        );
        setSpots(available);
      })
      .catch(() => {});
    setVehicleId(preselectedVehicleId?.toString() ?? "");
    setSpotId("");
  }, [open, preselectedVehicleId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/parking/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: parseInt(vehicleId, 10),
          spotId: parseInt(spotId, 10),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al asignar");
      }
      toast({ title: "Parqueo asignado" });
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo asignar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar parqueo</DialogTitle>
          <DialogDescription>
            Vincula un vehículo a un espacio disponible.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Vehículo</Label>
            <Select value={vehicleId} onValueChange={setVehicleId} required>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar vehículo" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>
                    {v.plate} — {v.resident.name} {v.resident.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Espacio</Label>
            <Select value={spotId} onValueChange={setSpotId} required>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar espacio" />
              </SelectTrigger>
              <SelectContent>
                {spots.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.code} {s.zone ? `(${s.zone})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Asignar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

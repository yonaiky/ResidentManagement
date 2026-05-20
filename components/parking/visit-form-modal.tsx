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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import type { ParkingSpotItem } from "@/lib/parking/types";
import { Loader2 } from "lucide-react";

type Resident = { id: number; name: string; lastName: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  preselectedResidentId?: number;
};

export function VisitFormModal({
  open,
  onOpenChange,
  onSuccess,
  preselectedResidentId,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [spots, setSpots] = useState<ParkingSpotItem[]>([]);
  const [plate, setPlate] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [hostResidentId, setHostResidentId] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [spotId, setSpotId] = useState("none");

  useEffect(() => {
    if (!open) return;
    const now = new Date();
    const later = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    setValidFrom(now.toISOString().slice(0, 16));
    setValidTo(later.toISOString().slice(0, 16));
    setPlate("");
    setVisitorName("");
    setHostResidentId(preselectedResidentId?.toString() ?? "");
    setSpotId("none");

    fetch("/api/residents")
      .then((r) => r.json())
      .then(setResidents)
      .catch(() => {});
    fetch("/api/parking/spots?spotType=visitor")
      .then((r) => r.json())
      .then((d) => setSpots(d.items ?? []))
      .catch(() => {});
  }, [open, preselectedResidentId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/parking/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plate,
          visitorName: visitorName || undefined,
          hostResidentId: parseInt(hostResidentId, 10),
          validFrom: new Date(validFrom).toISOString(),
          validTo: new Date(validTo).toISOString(),
          spotId: spotId !== "none" ? parseInt(spotId, 10) : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al registrar");
      }
      toast({ title: "Visita registrada" });
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo registrar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar visita</DialogTitle>
          <DialogDescription>
            Vehículo visitante con ventana de acceso al parqueo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Placa visitante</Label>
            <Input
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Nombre visitante (opcional)</Label>
            <Input value={visitorName} onChange={(e) => setVisitorName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Anfitrión (residente)</Label>
            <Select value={hostResidentId} onValueChange={setHostResidentId} required>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {residents.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.name} {r.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Desde</Label>
              <Input
                type="datetime-local"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Hasta</Label>
              <Input
                type="datetime-local"
                value={validTo}
                onChange={(e) => setValidTo(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Espacio visitante (opcional)</Label>
            <Select value={spotId} onValueChange={setSpotId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin espacio asignado</SelectItem>
                {spots.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Registrar visita
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

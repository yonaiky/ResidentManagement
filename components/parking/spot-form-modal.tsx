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
import { SPOT_STATUSES, SPOT_TYPES } from "@/lib/parking/constants";
import type { ParkingSpotItem } from "@/lib/parking/types";
import { Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  spot?: ParkingSpotItem | null;
};

export function SpotFormModal({ open, onOpenChange, onSuccess, spot }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [zone, setZone] = useState("");
  const [spotType, setSpotType] = useState("resident");
  const [status, setStatus] = useState("available");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open && spot) {
      setCode(spot.code);
      setZone(spot.zone ?? "");
      setSpotType(spot.spotType);
      setStatus(spot.status);
      setNotes(spot.notes ?? "");
    } else if (open) {
      setCode("");
      setZone("");
      setSpotType("resident");
      setStatus("available");
      setNotes("");
    }
  }, [open, spot]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) {
      toast({ title: "Código requerido", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const url = spot ? `/api/parking/spots/${spot.id}` : "/api/parking/spots";
      const res = await fetch(url, {
        method: spot ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          zone: zone.trim() || null,
          spotType,
          status,
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al guardar");
      }
      toast({ title: spot ? "Espacio actualizado" : "Espacio creado" });
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo guardar",
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
          <DialogTitle>{spot ? "Editar espacio" : "Nuevo espacio"}</DialogTitle>
          <DialogDescription>
            Registra un espacio de parqueo en el catálogo del residencial.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Código</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="P-A-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zone">Zona</Label>
            <Input
              id="zone"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              placeholder="Torre A / Sótano"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={spotType} onValueChange={setSpotType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPOT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado manual</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPOT_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

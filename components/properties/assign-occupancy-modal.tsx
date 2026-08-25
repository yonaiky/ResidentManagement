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
import { Loader2 } from "lucide-react";
import { OCCUPANCY_ROLES } from "@/lib/tenant/constants";

type ResidentOption = {
  id: number;
  name: string;
  lastName: string;
  cedula: string;
};

type Props = {
  unitId: string;
  unitCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function AssignOccupancyModal({
  unitId,
  unitCode,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [residents, setResidents] = useState<ResidentOption[]>([]);
  const [residentId, setResidentId] = useState("");
  const [role, setRole] = useState("owner");

  useEffect(() => {
    if (!open) return;
    fetch("/api/residents")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.items ?? [];
        setResidents(
          list.map((r: ResidentOption) => ({
            id: r.id,
            name: r.name,
            lastName: r.lastName,
            cedula: r.cedula,
          }))
        );
      })
      .catch(() => setResidents([]));
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!residentId) {
      toast({
        title: "Selecciona un residente",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/units/${unitId}/occupancies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          residentId: Number(residentId),
          role,
          isPrimary: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al asignar");
      toast({ title: "Residente asignado" });
      setResidentId("");
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Asignar residente</DialogTitle>
          <DialogDescription>
            Vincula un propietario o inquilino a la unidad {unitCode}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Residente</Label>
            <Select value={residentId} onValueChange={setResidentId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar residente" />
              </SelectTrigger>
              <SelectContent>
                {residents.length === 0 ? (
                  <SelectItem value="__empty" disabled>
                    No hay residentes — créalos primero
                  </SelectItem>
                ) : (
                  residents.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name} {r.lastName} ({r.cedula})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Rol en la unidad</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OCCUPANCY_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Asignando...
                </>
              ) : (
                "Asignar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
import { Loader2 } from "lucide-react";

type Resident = { id: number; name: string; lastName: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  preselectedResidentId?: number;
};

export function VehicleFormModal({
  open,
  onOpenChange,
  onSuccess,
  preselectedResidentId,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [plate, setPlate] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [residentId, setResidentId] = useState("");

  useEffect(() => {
    if (open) {
      fetch("/api/residents")
        .then((r) => r.json())
        .then(setResidents)
        .catch(() => {});
      setPlate("");
      setMake("");
      setModel("");
      setColor("");
      setResidentId(preselectedResidentId?.toString() ?? "");
    }
  }, [open, preselectedResidentId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/parking/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plate,
          make: make || undefined,
          model: model || undefined,
          color: color || undefined,
          residentId: parseInt(residentId, 10),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al registrar");
      }
      toast({ title: "Vehículo registrado" });
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar vehículo</DialogTitle>
          <DialogDescription>Asocia una placa a un residente.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Residente</Label>
            <Select value={residentId} onValueChange={setResidentId} required>
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
          <div className="space-y-2">
            <Label htmlFor="plate">Placa</Label>
            <Input
              id="plate"
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="A123456"
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <Label htmlFor="make">Marca</Label>
              <Input id="make" value={make} onChange={(e) => setMake(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Modelo</Label>
              <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input id="color" value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Registrar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

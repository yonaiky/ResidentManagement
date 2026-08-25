"use client";

import { useState } from "react";
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
import { Loader2, Plus } from "lucide-react";
import { UNIT_TYPES, UNIT_STATUSES } from "@/lib/tenant/constants";

type Props = {
  propertyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function AddUnitModal({
  propertyId,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [unitType, setUnitType] = useState("apartment");
  const [floor, setFloor] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [areaSqm, setAreaSqm] = useState("");
  const [status, setStatus] = useState("available");

  function reset() {
    setCode("");
    setUnitType("apartment");
    setFloor("");
    setBedrooms("");
    setAreaSqm("");
    setStatus("available");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) {
      toast({
        title: "Código requerido",
        description: "Ej. A-101, PH-1, LOCAL-3",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          unitType,
          floor: floor === "" ? null : floor,
          bedrooms: bedrooms === "" ? null : bedrooms,
          areaSqm: areaSqm === "" ? null : areaSqm,
          status,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "No se pudo crear la unidad");
      }
      toast({
        title: "Unidad creada",
        description: `Se agregó la unidad ${String(data.code ?? code).toUpperCase()}`,
      });
      reset();
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error al crear",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nueva unidad
          </DialogTitle>
          <DialogDescription>
            Una unidad es un apartamento, villa, local u otro espacio dentro del
            residencial (ej. A-101, Torre 2 Piso 5).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="unit-code">Código *</Label>
            <Input
              id="unit-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="A-101"
              required
            />
          </div>

          <div>
            <Label>Tipo</Label>
            <Select value={unitType} onValueChange={setUnitType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNIT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="unit-floor">Piso</Label>
              <Input
                id="unit-floor"
                type="number"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                placeholder="1"
              />
            </div>
            <div>
              <Label htmlFor="unit-bedrooms">Habitaciones</Label>
              <Input
                id="unit-bedrooms"
                type="number"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                placeholder="3"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="unit-area">Área (m²)</Label>
            <Input
              id="unit-area"
              type="number"
              step="0.01"
              value={areaSqm}
              onChange={(e) => setAreaSqm(e.target.value)}
              placeholder="85"
            />
          </div>

          <div>
            <Label>Estado</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNIT_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
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
                  Creando...
                </>
              ) : (
                "Crear unidad"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

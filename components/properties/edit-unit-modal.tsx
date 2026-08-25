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
import { UNIT_TYPES, UNIT_STATUSES } from "@/lib/tenant/constants";
import type { UnitDetail } from "@/lib/tenant/types";

type StructureOption = { id: string; name: string };

type Props = {
  unit: UnitDetail | null;
  structures: StructureOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function EditUnitModal({
  unit,
  structures,
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
  const [structureId, setStructureId] = useState<string>("__none__");

  useEffect(() => {
    if (!unit) return;
    setCode(unit.code);
    setUnitType(unit.unitType);
    setFloor(unit.floor != null ? String(unit.floor) : "");
    setBedrooms(unit.bedrooms != null ? String(unit.bedrooms) : "");
    setAreaSqm(unit.areaSqm != null ? String(unit.areaSqm) : "");
    setStatus(unit.status);
    setStructureId(unit.structureId ?? "__none__");
  }, [unit]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!unit) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/units/${unit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          unitType,
          floor: floor === "" ? null : floor,
          bedrooms: bedrooms === "" ? null : bedrooms,
          areaSqm: areaSqm === "" ? null : areaSqm,
          status,
          structureId: structureId === "__none__" ? null : structureId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al actualizar");
      toast({ title: "Unidad actualizada" });
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
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Editar unidad</DialogTitle>
          <DialogDescription>Actualiza datos y estado de la unidad</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Código</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} required />
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
          <div>
            <Label>Estructura (torre / bloque)</Label>
            <Select value={structureId} onValueChange={setStructureId}>
              <SelectTrigger>
                <SelectValue placeholder="Sin estructura" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sin estructura</SelectItem>
                {structures.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Piso</Label>
              <Input
                type="number"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
              />
            </div>
            <div>
              <Label>Habitaciones</Label>
              <Input
                type="number"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Área (m²)</Label>
            <Input
              type="number"
              step="0.01"
              value={areaSqm}
              onChange={(e) => setAreaSqm(e.target.value)}
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
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

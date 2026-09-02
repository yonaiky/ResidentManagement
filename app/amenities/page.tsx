"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

type Area = {
  id: string;
  name: string;
  openTime: string;
  closeTime: string;
  maxDurationMin: number;
  requiresApproval: boolean;
  priceAmount: number | null;
  blockIfDebt: boolean;
};

type Reservation = {
  id: string;
  commonAreaId: string;
  commonAreaName?: string;
  startAt: string;
  endAt: string;
  status: string;
  amount: number | null;
};

export default function AmenitiesPage() {
  const { toast } = useToast();
  const [areas, setAreas] = useState<Area[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [areaName, setAreaName] = useState("");
  const [price, setPrice] = useState("");
  const [commonAreaId, setCommonAreaId] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [unitId, setUnitId] = useState("");

  const load = useCallback(async () => {
    const [a, r] = await Promise.all([
      fetch("/api/common-areas").then((x) => x.json()),
      fetch("/api/reservations").then((x) => x.json()),
    ]);
    setAreas(a.items ?? []);
    setReservations(r.items ?? []);
    if (!commonAreaId && a.items?.[0]) setCommonAreaId(a.items[0].id);
  }, [commonAreaId]);

  useEffect(() => {
    load().catch(() =>
      toast({ title: "Error", description: "No se pudo cargar áreas/reservas" })
    );
  }, [load, toast]);

  async function createArea() {
    const res = await fetch("/api/common-areas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: areaName,
        priceAmount: price ? Number(price) : null,
        requiresApproval: true,
      }),
    });
    if (!res.ok) {
      const j = await res.json();
      toast({ title: "Error", description: j.error });
      return;
    }
    setAreaName("");
    setPrice("");
    await load();
  }

  async function createReservation() {
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commonAreaId,
        unitId: unitId || null,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
      }),
    });
    const j = await res.json();
    if (!res.ok) {
      toast({ title: "Error", description: j.error || "Falló" });
      return;
    }
    toast({ title: "Reserva creada", description: j.status });
    await load();
  }

  async function act(id: string, action: string) {
    const res = await fetch("/api/reservations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    const j = await res.json();
    if (!res.ok) {
      toast({ title: "Error", description: j.error });
      return;
    }
    await load();
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Áreas comunes y reservas</h1>
        <p className="text-sm text-muted-foreground">
          Sin solapes; cargos vía núcleo financiero si hay precio
        </p>
      </div>

      <section className="grid max-w-xl gap-3 rounded-lg border p-4">
        <h2 className="font-medium">Nueva área</h2>
        <div>
          <Label>Nombre</Label>
          <Input value={areaName} onChange={(e) => setAreaName(e.target.value)} placeholder="Gazebo" />
        </div>
        <div>
          <Label>Precio (opcional)</Label>
          <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="2500" />
        </div>
        <Button onClick={createArea}>Crear área</Button>
      </section>

      <section className="grid max-w-xl gap-3 rounded-lg border p-4">
        <h2 className="font-medium">Nueva reserva</h2>
        <div>
          <Label>Área</Label>
          <select
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={commonAreaId}
            onChange={(e) => setCommonAreaId(e.target.value)}
          >
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.openTime}–{a.closeTime})
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Unit ID (opcional, para cargo)</Label>
          <Input value={unitId} onChange={(e) => setUnitId(e.target.value)} />
        </div>
        <div>
          <Label>Inicio</Label>
          <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
        </div>
        <div>
          <Label>Fin</Label>
          <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
        </div>
        <Button onClick={createReservation}>Reservar</Button>
      </section>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Área</th>
              <th className="p-3">Inicio</th>
              <th className="p-3">Fin</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Monto</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.commonAreaName || r.commonAreaId}</td>
                <td className="p-3">{new Date(r.startAt).toLocaleString("es-DO")}</td>
                <td className="p-3">{new Date(r.endAt).toLocaleString("es-DO")}</td>
                <td className="p-3">{r.status}</td>
                <td className="p-3">{r.amount != null ? `RD$${r.amount}` : "—"}</td>
                <td className="p-3 space-x-2">
                  {r.status === "PENDING" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => act(r.id, "approve")}>
                        Aprobar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => act(r.id, "reject")}>
                        Rechazar
                      </Button>
                    </>
                  )}
                  {["PENDING", "APPROVED"].includes(r.status) && (
                    <Button size="sm" variant="ghost" onClick={() => act(r.id, "cancel")}>
                      Cancelar
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

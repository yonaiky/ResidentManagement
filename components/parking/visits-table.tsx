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
import { Badge } from "@/components/ui/badge";
import { VisitFormModal } from "@/components/parking/visit-form-modal";
import { getVisitStatusLabel } from "@/lib/parking/constants";
import type { ParkingVisitItem } from "@/lib/parking/types";
import { useAuthUserStore } from "@/store/auth-user-store";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, XCircle } from "lucide-react";

const CACHE_KEY = "parking-visits";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  scheduled: "secondary",
  expired: "outline",
  cancelled: "destructive",
};

export function VisitsTable() {
  const { toast } = useToast();
  const user = useAuthUserStore((s) => s.user);
  const canManage = user?.role === "admin" || user?.role === "manager";
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, refresh } = useApiQuery<{ items: ParkingVisitItem[] }>(
    CACHE_KEY,
    "/api/parking/visits"
  );

  const items = data?.items ?? [];

  const invalidateAll = () => {
    invalidateCache(CACHE_KEY);
    invalidateCache("parking-overview");
    void refresh();
  };

  async function cancelVisit(id: number) {
    try {
      const res = await fetch(`/api/parking/visits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Visita cancelada" });
      invalidateAll();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  }

  async function checkIn(v: ParkingVisitItem) {
    try {
      const code = v.accessCode
        ? window.prompt("Código de acceso (PIN)", v.accessCode) || undefined
        : undefined;
      const res = await fetch(`/api/parking/visits/${v.id}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode: code }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Error");
      toast({ title: "Entrada registrada" });
      invalidateAll();
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Falló",
        variant: "destructive",
      });
    }
  }

  async function checkOut(id: number) {
    try {
      const res = await fetch(`/api/parking/visits/${id}/check-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Error");
      toast({ title: "Salida registrada" });
      invalidateAll();
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Falló",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Registrar visita
        </Button>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Placa</TableHead>
              <TableHead>Visitante</TableHead>
              <TableHead>Anfitrión</TableHead>
              <TableHead>Vigencia</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Espacio</TableHead>
              <TableHead>PIN</TableHead>
              <TableHead>In/Out</TableHead>
              {canManage && <TableHead className="w-[160px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{v.plate}</TableCell>
                <TableCell>{v.visitorName ?? "—"}</TableCell>
                <TableCell>
                  {v.hostResident.name} {v.hostResident.lastName}
                </TableCell>
                <TableCell className="text-sm">
                  {format(new Date(v.validFrom), "dd/MM HH:mm", { locale: es })} —{" "}
                  {format(new Date(v.validTo), "dd/MM HH:mm", { locale: es })}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant[v.computedStatus] ?? "outline"}>
                    {getVisitStatusLabel(v.computedStatus)}
                  </Badge>
                </TableCell>
                <TableCell>{v.spot?.code ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs">
                  {v.accessCode ?? "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {v.checkedInAt
                    ? format(new Date(v.checkedInAt), "HH:mm", { locale: es })
                    : "—"}
                  {" / "}
                  {v.checkedOutAt
                    ? format(new Date(v.checkedOutAt), "HH:mm", { locale: es })
                    : "—"}
                </TableCell>
                {canManage && (
                  <TableCell className="space-x-1 whitespace-nowrap">
                    {!v.checkedInAt && v.computedStatus !== "cancelled" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => checkIn(v)}
                      >
                        Entrada
                      </Button>
                    )}
                    {v.checkedInAt && !v.checkedOutAt && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => checkOut(v.id)}
                      >
                        Salida
                      </Button>
                    )}
                    {v.computedStatus !== "cancelled" && !v.checkedOutAt && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => cancelVisit(v.id)}
                        disabled={v.computedStatus === "expired"}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <VisitFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={invalidateAll}
      />
    </div>
  );
}

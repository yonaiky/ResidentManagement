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
import { FineFormModal } from "@/components/parking/fine-form-modal";
import { getFineStatusLabel } from "@/lib/parking/constants";
import type { ParkingFineItem } from "@/lib/parking/types";
import { useAuthUserStore } from "@/store/auth-user-store";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { Plus, Check, Ban } from "lucide-react";

const CACHE_KEY = "parking-fines";

export function FinesTable() {
  const { toast } = useToast();
  const user = useAuthUserStore((s) => s.user);
  const canManage = user?.role === "admin" || user?.role === "manager";
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, refresh } = useApiQuery<{ items: ParkingFineItem[] }>(
    CACHE_KEY,
    "/api/parking/fines"
  );

  const items = data?.items ?? [];

  const invalidateAll = () => {
    invalidateCache(CACHE_KEY);
    invalidateCache("parking-overview");
    void refresh();
  };

  async function updateStatus(id: number, status: "paid" | "waived") {
    try {
      const res = await fetch(`/api/parking/fines/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast({
        title: status === "paid" ? "Multa marcada como pagada" : "Multa perdonada",
      });
      invalidateAll();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Registrar multa
        </Button>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Placa</TableHead>
              <TableHead>Residente</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Emitida</TableHead>
              {canManage && <TableHead className="w-[120px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.plate}</TableCell>
                <TableCell>
                  {f.resident
                    ? `${f.resident.name} ${f.resident.lastName}`
                    : "—"}
                </TableCell>
                <TableCell>RD$ {f.amount.toLocaleString("es-DO")}</TableCell>
                <TableCell className="max-w-[200px] truncate">{f.reason}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      f.status === "pending"
                        ? "destructive"
                        : f.status === "paid"
                          ? "default"
                          : "secondary"
                    }
                  >
                    {getFineStatusLabel(f.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {format(new Date(f.issuedAt), "dd/MM/yyyy")}
                </TableCell>
                {canManage && f.status === "pending" && (
                  <TableCell className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateStatus(f.id, "paid")}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateStatus(f.id, "waived")}
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <FineFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={invalidateAll}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { AssignTechnicianSelect } from "@/components/tickets/assign-technician-select";
import { TICKET_STATUSES } from "@/lib/tickets/constants";
import {
  canTechnicianTransition,
  canTransition,
} from "@/lib/tickets/status";
import type { TicketDetail } from "@/lib/tickets/types";
import { Loader2 } from "lucide-react";
import { useAuthUserStore } from "@/store/auth-user-store";

type Props = {
  ticket: TicketDetail;
  onUpdated: () => void;
};

export function TicketDetailActions({ ticket, onUpdated }: Props) {
  const { toast } = useToast();
  const user = useAuthUserStore((s) => s.user);
  const isTechnician = user?.role === "technician";
  const isManager =
    user?.role === "admin" || user?.role === "manager";
  const isAdmin = user?.role === "admin";
  const isAssignedToMe = ticket.assignedTo?.id === user?.id;

  const [status, setStatus] = useState(ticket.status);
  const [statusNote, setStatusNote] = useState("");
  const [assigneeId, setAssigneeId] = useState(ticket.assignedTo?.id ?? "");
  const [statusLoading, setStatusLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);

  const terminal = ticket.status === "closed" || ticket.status === "cancelled";

  const statusOptions = TICKET_STATUSES.filter((s) => {
    if (s.value === "cancelled" && !isAdmin) return false;
    if (isTechnician) {
      return canTechnicianTransition(ticket.status, s.value);
    }
    if (isManager) return true;
    return false;
  });

  async function handleStatusChange() {
    if (status === ticket.status) return;
    if (status === "cancelled" && !isAdmin) {
      toast({
        title: "Sin permiso",
        description: "Solo administradores pueden cancelar tickets",
        variant: "destructive",
      });
      return;
    }

    try {
      setStatusLoading(true);
      const res = await fetch(`/api/tickets/${ticket.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note: statusNote || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Error al cambiar estado");
      }
      toast({ title: "Estado actualizado" });
      setStatusNote("");
      onUpdated();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "No se pudo actualizar",
        variant: "destructive",
      });
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleAssign() {
    const current = ticket.assignedTo?.id ?? "";
    if (assigneeId === current) return;

    try {
      setAssignLoading(true);
      const res = await fetch(`/api/tickets/${ticket.id}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedToId: assigneeId || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Error al asignar");
      }
      toast({ title: "Técnico asignado" });
      onUpdated();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "No se pudo asignar",
        variant: "destructive",
      });
    } finally {
      setAssignLoading(false);
    }
  }

  if (isTechnician && !isAssignedToMe) {
    return (
      <p className="text-sm text-muted-foreground">
        No tienes acceso a este ticket.
      </p>
    );
  }

  if (isTechnician && isAssignedToMe) {
    if (terminal) {
      return (
        <p className="text-sm text-muted-foreground">
          Este ticket está cerrado y no admite más cambios.
        </p>
      );
    }

    if (statusOptions.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          No hay cambios de estado disponibles para este ticket.
        </p>
      );
    }

    return (
      <div className="space-y-2">
        <Label>Actualizar estado</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          placeholder="Nota opcional..."
          value={statusNote}
          onChange={(e) => setStatusNote(e.target.value)}
          rows={2}
        />
        <Button
          size="sm"
          onClick={handleStatusChange}
          disabled={statusLoading || status === ticket.status}
        >
          {statusLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar estado
        </Button>
      </div>
    );
  }

  if (!isManager) {
    return (
      <p className="text-sm text-muted-foreground">
        Solo managers y administradores pueden cambiar estado o asignar técnicos.
      </p>
    );
  }

  if (terminal) {
    return (
      <p className="text-sm text-muted-foreground">
        Este ticket está cerrado y no admite más cambios.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <AssignTechnicianSelect
        value={assigneeId}
        onChange={setAssigneeId}
        disabled={assignLoading}
      />
      <Button
        size="sm"
        onClick={handleAssign}
        disabled={assignLoading || assigneeId === (ticket.assignedTo?.id ?? "")}
      >
        {assignLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Guardar asignación
      </Button>

      <div className="space-y-2 border-t pt-4">
        <Label>Cambiar estado</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TICKET_STATUSES.filter((s) => {
              if (s.value === "cancelled" && !isAdmin) return false;
              return true;
            }).map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          placeholder="Nota opcional para el historial..."
          value={statusNote}
          onChange={(e) => setStatusNote(e.target.value)}
          rows={2}
        />
        <Button
          size="sm"
          onClick={handleStatusChange}
          disabled={statusLoading || status === ticket.status}
        >
          {statusLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Actualizar estado
        </Button>
      </div>
    </div>
  );
}

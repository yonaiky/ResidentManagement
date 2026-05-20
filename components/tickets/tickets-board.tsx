"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { TicketBoardCard } from "@/components/tickets/ticket-board-card";
import { TicketBoardColumn } from "@/components/tickets/ticket-board-column";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuthUserStore } from "@/store/auth-user-store";
import {
  getBoardColumnStatuses,
  groupTicketsByStatus,
  parseColumnDropId,
  parseTicketDragId,
} from "@/lib/tickets/board";
import { canTechnicianTransition, canTransition } from "@/lib/tickets/status";
import type { TicketListItem } from "@/lib/tickets/types";
import { Loader2 } from "lucide-react";

type Props = {
  items: TicketListItem[];
  isLoading: boolean;
  onTicketMoved: () => void;
};

export function TicketsBoard({ items, isLoading, onTicketMoved }: Props) {
  const { toast } = useToast();
  const user = useAuthUserStore((s) => s.user);
  const [includeCancelled, setIncludeCancelled] = useState(false);
  const [localItems, setLocalItems] = useState<TicketListItem[]>(items);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const isTechnician = user?.role === "technician";
  const isManager = user?.role === "admin" || user?.role === "manager";
  const isAdmin = user?.role === "admin";
  const canDrag = isManager || isTechnician;

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const columnStatuses = useMemo(
    () => getBoardColumnStatuses(includeCancelled),
    [includeCancelled]
  );

  const grouped = useMemo(
    () => groupTicketsByStatus(localItems, columnStatuses),
    [localItems, columnStatuses]
  );

  const activeTicket = useMemo(() => {
    const id = activeDragId ? parseTicketDragId(activeDragId) : null;
    if (id == null) return null;
    return localItems.find((t) => t.id === id) ?? null;
  }, [activeDragId, localItems]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveDragId(null);
      const { active, over } = event;
      if (!over || !canDrag) return;

      const ticketId = parseTicketDragId(String(active.id));
      const toStatus = parseColumnDropId(String(over.id));
      if (ticketId == null || !toStatus) return;

      const ticket = localItems.find((t) => t.id === ticketId);
      if (!ticket || ticket.status === toStatus) return;

      if (toStatus === "cancelled" && !isAdmin) {
        toast({
          title: "Sin permiso",
          description: "Solo administradores pueden cancelar tickets",
          variant: "destructive",
        });
        return;
      }

      const transitionOk = isTechnician
        ? canTechnicianTransition(ticket.status, toStatus)
        : canTransition(ticket.status, toStatus);

      if (!transitionOk) {
        toast({
          title: "Transición no permitida",
          description: `No se puede pasar de ${ticket.status} a ${toStatus}`,
          variant: "destructive",
        });
        return;
      }

      const previous = [...localItems];
      setLocalItems((prev) =>
        prev.map((t) =>
          t.id === ticketId ? { ...t, status: toStatus } : t
        )
      );

      try {
        const res = await fetch(`/api/tickets/${ticketId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: toStatus, note: "Movido desde tablero" }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Error al actualizar estado");
        }
        toast({ title: "Estado actualizado" });
        onTicketMoved();
      } catch (error) {
        setLocalItems(previous);
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "No se pudo mover el ticket",
          variant: "destructive",
        });
      }
    },
    [canDrag, isAdmin, isTechnician, localItems, toast, onTicketMoved]
  );

  const handleDragCancel = useCallback(() => {
    setActiveDragId(null);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (localItems.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        No hay tickets con los filtros seleccionados.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Switch
          id="include-cancelled"
          checked={includeCancelled}
          onCheckedChange={setIncludeCancelled}
        />
        <Label htmlFor="include-cancelled" className="cursor-pointer text-sm">
          Incluir cancelados
        </Label>
        {!canDrag && (
          <span className="text-xs text-muted-foreground">
            (Solo lectura)
          </span>
        )}
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {columnStatuses.map((status) => (
            <TicketBoardColumn
              key={status}
              status={status}
              tickets={grouped[status] ?? []}
              draggable={canDrag}
              activeDragId={activeDragId}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTicket ? (
            <div className="w-[280px] rotate-2 opacity-95 shadow-lg">
              <TicketBoardCard
                ticket={activeTicket}
                draggable={false}
                isDragging
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

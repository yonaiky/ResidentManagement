"use client";

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
import { Switch } from "@/components/ui/switch";
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from "@/lib/tickets/constants";
import type { TicketsFilters } from "@/lib/tickets/types";
import { Filter, RotateCcw } from "lucide-react";

type Props = {
  draft: TicketsFilters;
  onUpdate: <K extends keyof TicketsFilters>(key: K, value: TicketsFilters[K]) => void;
  onApply: () => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  hideStatusFilter?: boolean;
};

export function TicketsFiltersBar({
  draft,
  onUpdate,
  onApply,
  onReset,
  hasActiveFilters,
  hideStatusFilter = false,
}: Props) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="ticket-search">Buscar</Label>
          <Input
            id="ticket-search"
            placeholder="Número, título, ubicación..."
            value={draft.search}
            onChange={(e) => onUpdate("search", e.target.value)}
          />
        </div>
        {!hideStatusFilter && (
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select
              value={draft.status || "all"}
              onValueChange={(v) => onUpdate("status", v === "all" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {TICKET_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-2">
          <Label>Prioridad</Label>
          <Select
            value={draft.priority || "all"}
            onValueChange={(v) => onUpdate("priority", v === "all" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {TICKET_PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Categoría</Label>
          <Select
            value={draft.category || "all"}
            onValueChange={(v) => onUpdate("category", v === "all" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {TICKET_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-2 pb-0.5">
          <div className="flex items-center gap-2">
            <Switch
              id="unassigned"
              checked={draft.unassigned}
              onCheckedChange={(v) => onUpdate("unassigned", v)}
            />
            <Label htmlFor="unassigned" className="cursor-pointer text-sm">
              Sin asignar
            </Label>
          </div>
        </div>
        <div className="flex items-end gap-2 pb-0.5">
          <div className="flex items-center gap-2">
            <Switch
              id="sla-breached"
              checked={draft.slaBreached}
              onCheckedChange={(v) => onUpdate("slaBreached", v)}
            />
            <Label htmlFor="sla-breached" className="cursor-pointer text-sm">
              SLA vencido
            </Label>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onApply}>
          <Filter className="mr-2 h-4 w-4" />
          Aplicar filtros
        </Button>
        {hasActiveFilters && (
          <Button type="button" variant="outline" onClick={onReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>
    </div>
  );
}

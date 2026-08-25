"use client";

import { cn } from "@/lib/utils";
import type { UnitMapItem } from "@/lib/tenant/types";
import { getUnitStatusLabel } from "@/lib/tenant/constants";

const statusColors: Record<string, string> = {
  available: "bg-emerald-500/20 border-emerald-500/40",
  occupied: "bg-amber-500/20 border-amber-500/40",
  maintenance: "bg-slate-500/20 border-slate-500/40",
  reserved: "bg-violet-500/20 border-violet-500/40",
  inactive: "bg-muted border-border",
};

type Props = {
  items: UnitMapItem[];
  onSelect: (unit: UnitMapItem) => void;
  onAddClick?: () => void;
};

export function UnitMapGrid({ items, onSelect, onAddClick }: Props) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-muted-foreground">
          Sin unidades todavía. Una unidad es un apartamento, villa o local del
          residencial.
        </p>
        {onAddClick && (
          <button
            type="button"
            onClick={onAddClick}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Agregar la primera unidad
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {items.map((u) => (
        <button
          key={u.id}
          type="button"
          onClick={() => onSelect(u)}
          className={cn(
            "rounded-lg border p-3 text-left transition hover:ring-2 hover:ring-primary",
            statusColors[u.computedStatus] ?? statusColors.available
          )}
        >
          <p className="font-semibold">{u.code}</p>
          <p className="text-xs text-muted-foreground">
            {u.structureName ?? "—"} {u.floor != null ? `· P${u.floor}` : ""}
          </p>
          <p className="mt-1 text-xs">{getUnitStatusLabel(u.computedStatus)}</p>
        </button>
      ))}
    </div>
  );
}

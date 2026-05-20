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
};

export function UnitMapGrid({ items, onSelect }: Props) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Sin unidades. Agrega unidades en la pestaña Unidades.</p>
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

"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { TicketsViewMode } from "@/hooks/use-tickets-view-mode";
import { Columns3, LayoutList } from "lucide-react";

type Props = {
  value: TicketsViewMode;
  onChange: (mode: TicketsViewMode) => void;
};

export function TicketsViewToggle({ value, onChange }: Props) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => {
        if (v === "table" || v === "board") onChange(v);
      }}
      className="rounded-lg border bg-muted/40 p-0.5"
    >
      <ToggleGroupItem
        value="table"
        aria-label="Vista lista"
        className="gap-1.5 px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm"
      >
        <LayoutList className="h-4 w-4" />
        <span className="hidden sm:inline">Lista</span>
      </ToggleGroupItem>
      <ToggleGroupItem
        value="board"
        aria-label="Vista tablero"
        className="gap-1.5 px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm"
      >
        <Columns3 className="h-4 w-4" />
        <span className="hidden sm:inline">Tablero</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

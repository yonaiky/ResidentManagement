"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, CheckCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PeriodCard } from "./period-card";
import type { BillingPeriod } from "./types";

type PeriodSelectorProps = {
  periods: BillingPeriod[];
  selectedCount: number;
  isSelected: (period: BillingPeriod) => boolean;
  onToggle: (period: BillingPeriod) => void;
  onSelectAll: () => void;
  onClear: () => void;
};

function PeriodSelectorComponent({
  periods,
  selectedCount,
  isSelected,
  onToggle,
  onSelectAll,
  onClear,
}: PeriodSelectorProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Períodos a facturar
            </h3>
            <p className="text-xs text-slate-500">
              {periods.length} disponible{periods.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            {selectedCount > 0 && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-semibold text-blue-300 ring-1 ring-blue-500/25"
              >
                {selectedCount} seleccionado{selectedCount !== 1 ? "s" : ""}
              </motion.span>
            )}
          </AnimatePresence>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onSelectAll}
            className="h-8 text-xs text-slate-400 hover:bg-white/[0.06] hover:text-slate-100"
          >
            <CheckCheck className="mr-1 h-3.5 w-3.5" />
            Todos
          </Button>
          {selectedCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-8 text-xs text-slate-400 hover:bg-white/[0.06] hover:text-slate-100"
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {periods.length === 0 ? (
        <div
          className={cn(
            "rounded-2xl border border-dashed border-white/10 py-12 text-center",
            "bg-white/[0.02]"
          )}
        >
          <Calendar className="mx-auto h-10 w-10 text-slate-600" />
          <p className="mt-3 text-sm font-medium text-slate-400">
            No hay períodos pendientes
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Todos los períodos están al día
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {periods.map((period, index) => (
            <PeriodCard
              key={`${period.year}-${period.month}`}
              period={period}
              selected={isSelected(period)}
              onToggle={() => onToggle(period)}
              index={index}
            />
          ))}
        </div>
      )}
    </motion.section>
  );
}

export const PeriodSelector = memo(PeriodSelectorComponent);

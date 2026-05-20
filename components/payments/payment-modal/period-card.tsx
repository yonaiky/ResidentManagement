"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BillingPeriod } from "./types";

type PeriodCardProps = {
  period: BillingPeriod;
  selected: boolean;
  onToggle: () => void;
  index?: number;
};

function StatusBadge({ period }: { period: BillingPeriod }) {
  if (period.status === "overdue") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-300 ring-1 ring-red-500/25">
        <AlertTriangle className="h-3 w-3" />
        Vencido · {period.daysOverdue}d
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300 ring-1 ring-amber-500/25">
      <Clock className="h-3 w-3" />
      {period.daysRemaining}d restantes
    </span>
  );
}

function PeriodCardComponent({
  period,
  selected,
  onToggle,
  index = 0,
}: PeriodCardProps) {
  const label = format(new Date(period.year, period.month - 1), "MMMM yyyy", {
    locale: es,
  });
  const dueLabel = format(period.dueDate, "dd MMM yyyy", { locale: es });

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 400, damping: 30 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={onToggle}
      className={cn(
        "group relative w-full rounded-2xl border p-4 text-left outline-none transition-shadow",
        "focus-visible:ring-2 focus-visible:ring-blue-500/50",
        selected
          ? "border-blue-500/50 bg-gradient-to-br from-blue-500/15 via-[#2563EB]/10 to-purple-500/10 shadow-lg shadow-blue-500/15"
          : "border-white/[0.08] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04] hover:shadow-md hover:shadow-black/20"
      )}
      aria-pressed={selected}
    >
      {selected && (
        <motion.span
          layoutId="period-selected-glow"
          className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-blue-400/40"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <motion.div
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-colors",
              selected
                ? "border-blue-400/50 bg-blue-500 text-white"
                : "border-white/15 bg-white/[0.04] text-transparent group-hover:border-white/25"
            )}
            animate={selected ? { scale: [1, 1.15, 1] } : {}}
          >
            {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
          </motion.div>

          <div>
            <p className="text-sm font-semibold capitalize text-slate-100">
              {label}
            </p>
            <p className="mt-1 text-xs text-slate-500">Vence {dueLabel}</p>
            <div className="mt-2">
              <StatusBadge period={period} />
            </div>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
            Monto
          </p>
          <p className="mt-0.5 font-[family-name:var(--font-jakarta)] text-xl font-bold tabular-nums text-slate-100">
            ${period.amount.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

export const PeriodCard = memo(PeriodCardComponent);

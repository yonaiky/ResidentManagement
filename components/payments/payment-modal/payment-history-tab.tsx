"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, FileText } from "lucide-react";
import type { BillingPeriod } from "./types";

type PaymentHistoryTabProps = {
  history: BillingPeriod[];
};

function PaymentHistoryTabComponent({ history }: PaymentHistoryTabProps) {
  if (history.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 py-16 text-center"
      >
        <FileText className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-sm font-medium text-muted-foreground">
          Sin historial de pagos
        </p>
        <p className="mt-1 text-xs text-muted-foreground/80">
          Los pagos procesados aparecerán aquí
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid gap-3 sm:grid-cols-2"
    >
      {history.map((period, index) => (
        <motion.div
          key={`${period.year}-${period.month}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04 }}
          className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold capitalize text-foreground">
                {format(new Date(period.year, period.month - 1), "MMMM yyyy", {
                  locale: es,
                })}
              </p>
              <p className="text-xs text-muted-foreground">
                Pagado · vence{" "}
                {format(period.dueDate, "dd MMM yyyy", { locale: es })}
              </p>
            </div>
          </div>
          <p className="font-[family-name:var(--font-jakarta)] text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
            ${period.amount.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
          </p>
        </motion.div>
      ))}
    </motion.div>
  );
}

export const PaymentHistoryTab = memo(PaymentHistoryTabComponent);

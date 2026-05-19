"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertCircle, ChevronRight } from "lucide-react";
import type { PendingResident } from "@/lib/dashboard/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PaymentWidgetProps = {
  pending: PendingResident[];
};

export function PaymentWidget({ pending }: PaymentWidgetProps) {
  const display = pending.slice(0, 5);

  if (display.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Todo al día</p>
        <p className="mt-1 text-xs">No hay pagos pendientes</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {display.map((item, i) => (
        <motion.li
          key={item.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Link
            href="/payments"
            className={cn(
              "flex items-center gap-3 rounded-xl border border-border/40 p-3",
              "transition-colors hover:bg-muted/40"
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.name}</p>
              {item.dueDate && (
                <p className="text-xs text-muted-foreground">
                  Vence {format(new Date(item.dueDate), "d MMM", { locale: es })}
                </p>
              )}
            </div>
            <span className="text-sm font-semibold">${item.amount.toFixed(0)}</span>
          </Link>
        </motion.li>
      ))}
      {pending.length > 5 && (
        <Button variant="ghost" size="sm" className="w-full" asChild>
          <Link href="/payments">
            Ver todos ({pending.length})
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      )}
    </ul>
  );
}

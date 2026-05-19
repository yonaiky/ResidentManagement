"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { UserPlus } from "lucide-react";
import type { RecentResident } from "@/lib/dashboard/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type RecentResidentsWidgetProps = {
  residents: RecentResident[];
};

const statusVariant: Record<string, string> = {
  paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  overdue: "bg-red-500/15 text-red-700 dark:text-red-400",
};

export function RecentResidentsWidget({ residents }: RecentResidentsWidgetProps) {
  if (residents.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No hay residentes recientes
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {residents.map((r, i) => (
        <motion.li
          key={r.id}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Link
            href="/residents"
            className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/40"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserPlus className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {r.name} {r.lastName}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(r.createdAt), {
                  addSuffix: true,
                  locale: es,
                })}
              </p>
            </div>
            <Badge
              variant="secondary"
              className={cn("text-[10px] capitalize", statusVariant[r.paymentStatus])}
            >
              {r.paymentStatus}
            </Badge>
          </Link>
        </motion.li>
      ))}
    </ul>
  );
}

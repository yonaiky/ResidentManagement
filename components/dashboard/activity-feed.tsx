"use client";

import { motion } from "framer-motion";
import { DollarSign, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { DashboardActivity } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

type ActivityFeedProps = {
  activities: DashboardActivity[];
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
          <Inbox className="h-7 w-7 text-muted-foreground/60" />
        </div>
        <p className="text-sm font-medium">Sin actividad reciente</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Los pagos aparecerán aquí en tiempo real
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-1">
      {activities.map((activity, i) => (
        <motion.li
          key={activity.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className={cn(
            "group flex items-center gap-3 rounded-xl p-3 transition-colors",
            "hover:bg-muted/50"
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <DollarSign className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {activity.residentName}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(activity.paymentDate), {
                addSuffix: true,
                locale: es,
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              ${activity.amount.toFixed(2)}
            </p>
            {activity.noRegistro && (
              <p className="text-xs text-muted-foreground">#{activity.noRegistro}</p>
            )}
          </div>
        </motion.li>
      ))}
    </ul>
  );
}

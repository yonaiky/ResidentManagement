"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "./animated-counter";

type OccupancyWidgetProps = {
  rate: number;
  paid: number;
  total: number;
  monthlyGoal: number;
  monthlyProgress: number;
  currentRevenue: number;
};

function ProgressBar({ value, className }: { value: number; className?: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted/60", className)}>
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED]"
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}

export function OccupancyWidget({
  rate,
  paid,
  total,
  monthlyGoal,
  monthlyProgress,
  currentRevenue,
}: OccupancyWidgetProps) {
  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-end justify-between">
          <span className="text-sm text-muted-foreground">Ocupación residencial</span>
          <span className="text-2xl font-bold">
            <AnimatedCounter value={rate} suffix="%" />
          </span>
        </div>
        <ProgressBar value={rate} />
        <p className="mt-2 text-xs text-muted-foreground">
          {paid} de {total} residentes al día con pagos
        </p>
      </div>
      <div className="rounded-xl border border-border/40 bg-muted/20 p-4">
        <div className="mb-2 flex items-end justify-between">
          <span className="text-sm font-medium">Meta mensual</span>
          <span className="text-sm text-muted-foreground">
            <AnimatedCounter value={monthlyProgress} suffix="%" />
          </span>
        </div>
        <ProgressBar value={monthlyProgress} />
        <p className="mt-2 text-xs text-muted-foreground">
          ${currentRevenue.toLocaleString("es-DO")} / $
          {monthlyGoal.toLocaleString("es-DO", { maximumFractionDigits: 0 })}
        </p>
      </div>
    </div>
  );
}

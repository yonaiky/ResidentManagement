"use client";

import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "./animated-counter";
import type { SparklinePoint } from "@/lib/dashboard/types";

export type StatCardProps = {
  title: string;
  value: number;
  format?: "number" | "currency";
  trend?: number;
  trendLabel?: string;
  subtitle?: string;
  icon: LucideIcon;
  gradient: string;
  glow: string;
  iconBg: string;
  sparkline?: SparklinePoint[];
  sparkColor?: string;
  index?: number;
};

export function StatCard({
  title,
  value,
  format = "number",
  trend,
  trendLabel = "vs mes anterior",
  subtitle,
  icon: Icon,
  gradient,
  glow,
  iconBg,
  sparkline = [],
  sparkColor = "#2563EB",
  index = 0,
}: StatCardProps) {
  const isPositive = (trend ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm",
        gradient
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl transition-opacity group-hover:opacity-100 opacity-60",
          glow
        )}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-3 min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground/90">{title}</p>
          <div className="text-3xl font-bold tracking-tight text-foreground">
            {format === "currency" ? (
              <AnimatedCounter value={value} decimals={2} prefix="$" />
            ) : (
              <AnimatedCounter value={value} decimals={0} />
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className="flex items-center gap-1.5 text-xs">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-semibold",
                  isPositive
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/15 text-red-600 dark:text-red-400"
                )}
              >
                {isPositive ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
                {Math.abs(trend).toFixed(1)}%
              </span>
              <span className="text-muted-foreground">{trendLabel}</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl backdrop-blur-md",
            iconBg
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {sparkline.length > 0 && (
        <div className="relative mt-4 h-12 w-full opacity-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkline}>
              <defs>
                <linearGradient id={`spark-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparkColor} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={sparkColor}
                strokeWidth={2}
                fill={`url(#spark-${title})`}
                dot={false}
                isAnimationActive
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}

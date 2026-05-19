"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import type { WeeklyActivityPoint } from "@/lib/dashboard/types";
import { DASHBOARD_COLORS } from "@/lib/dashboard/constants";

type WeeklyBarChartProps = {
  data: WeeklyActivityPoint[];
};

export function WeeklyBarChart({ data }: WeeklyBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={DASHBOARD_COLORS.secondary} />
            <stop offset="100%" stopColor={DASHBOARD_COLORS.primary} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          width={32}
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--muted))", opacity: 0.15 }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--popover))",
            backdropFilter: "blur(12px)",
          }}
          formatter={(value: number, name: string) => [
            name === "payments" ? value : `$${value.toFixed(0)}`,
            name === "payments" ? "Pagos" : "Monto",
          ]}
        />
        <Bar
          dataKey="payments"
          fill="url(#barGradient)"
          radius={[6, 6, 0, 0]}
          animationDuration={700}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

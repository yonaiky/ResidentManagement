"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import type { MonthlyRevenuePoint } from "@/lib/dashboard/types";
import { DASHBOARD_COLORS } from "@/lib/dashboard/constants";

type RevenueAreaChartProps = {
  data: MonthlyRevenuePoint[];
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/50 bg-popover/95 px-3 py-2 shadow-xl backdrop-blur-md">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.dataKey === "revenue" ? "Ingresos" : "Pendiente"}: $
          {entry.value.toLocaleString("es-DO", { minimumFractionDigits: 0 })}
        </p>
      ))}
    </div>
  );
}

export function RevenueAreaChart({ data }: RevenueAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={DASHBOARD_COLORS.primary} stopOpacity={0.35} />
            <stop offset="100%" stopColor={DASHBOARD_COLORS.primary} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={DASHBOARD_COLORS.warning} stopOpacity={0.25} />
            <stop offset="100%" stopColor={DASHBOARD_COLORS.warning} stopOpacity={0} />
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
          tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke={DASHBOARD_COLORS.primary}
          strokeWidth={2}
          fill="url(#revenueGradient)"
          animationDuration={800}
        />
        <Area
          type="monotone"
          dataKey="pending"
          stroke={DASHBOARD_COLORS.warning}
          strokeWidth={2}
          fill="url(#pendingGradient)"
          animationDuration={800}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

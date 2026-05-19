"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { PaymentStatusSlice } from "@/lib/dashboard/types";

type PaymentDonutChartProps = {
  data: PaymentStatusSlice[];
};

export function PaymentDonutChart({ data }: PaymentDonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-muted-foreground">
        Sin datos de pagos
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center gap-4 sm:flex-row">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            animationDuration={700}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--popover))",
            }}
            formatter={(value: number, name: string) => [
              `${value} (${((value / total) * 100).toFixed(0)}%)`,
              name,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex flex-wrap justify-center gap-3 sm:flex-col sm:justify-start">
        {data.map((item) => (
          <li key={item.name} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.fill }}
            />
            <span className="text-muted-foreground">{item.name}</span>
            <span className="font-semibold">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

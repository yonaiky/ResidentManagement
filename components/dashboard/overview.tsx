"use client";

import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  Legend, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from "recharts";

const data = [
  {
    name: "Jan",
    total: 1800,
    pending: 300,
  },
  {
    name: "Feb",
    total: 2200,
    pending: 400,
  },
  {
    name: "Mar",
    total: 2400,
    pending: 350,
  },
  {
    name: "Apr",
    total: 2800,
    pending: 250,
  },
  {
    name: "May",
    total: 2900,
    pending: 200,
  },
  {
    name: "Jun",
    total: 3000,
    pending: 150,
  },
  {
    name: "Jul",
    total: 3200,
    pending: 100,
  },
  {
    name: "Aug",
    total: 3500,
    pending: 120,
  },
  {
    name: "Sep",
    total: 3700,
    pending: 230,
  },
  {
    name: "Oct",
    total: 4000,
    pending: 300,
  },
  {
    name: "Nov",
    total: 4500,
    pending: 400,
  },
  {
    name: "Dec",
    total: 5000,
    pending: 200,
  },
];

export function Overview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip 
          formatter={(value) => [`$${value}`, ""]}
          cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
        />
        <Legend />
        <Bar
          dataKey="total"
          name="Total Payments"
          fill="hsl(var(--chart-1))"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="pending"
          name="Pending Payments"
          fill="hsl(var(--chart-2))"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
"use client";

import { useEffect, useState } from "react";
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
import { useToast } from "@/components/ui/use-toast";

type MonthlyData = {
  name: string;
  total: number;
  pending: number;
};

export function Overview() {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMonthlyStats();
  }, []);

  const fetchMonthlyStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      if (!res.ok) throw new Error("Error al cargar las estadísticas mensuales");
      const monthlyData = await res.json();
      setData(monthlyData);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas mensuales",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Cargando estadísticas...</div>;
  }

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
          name="Pagos Totales"
          fill="hsl(var(--chart-1))"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="pending"
          name="Pagos Pendientes"
          fill="hsl(var(--chart-2))"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
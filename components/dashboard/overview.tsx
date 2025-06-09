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
  YAxis,
  Cell
} from "recharts";
import { useToast } from "@/components/ui/use-toast";

type MonthlyData = {
  name: string;
  total: number;
  pending: number;
};

const COLORS = {
  total: '#3b82f6',
  pending: '#f59e0b'
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
      // Generate mock data for now since the API endpoint doesn't exist
      const mockData = [
        { name: 'Ene', total: 4000, pending: 400 },
        { name: 'Feb', total: 3000, pending: 300 },
        { name: 'Mar', total: 5000, pending: 200 },
        { name: 'Abr', total: 4500, pending: 600 },
        { name: 'May', total: 6000, pending: 500 },
        { name: 'Jun', total: 5500, pending: 300 },
        { name: 'Jul', total: 7000, pending: 400 },
        { name: 'Ago', total: 6500, pending: 200 },
        { name: 'Sep', total: 8000, pending: 600 },
        { name: 'Oct', total: 7500, pending: 500 },
        { name: 'Nov', total: 9000, pending: 300 },
        { name: 'Dic', total: 8500, pending: 400 },
      ];
      setData(mockData);
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
    return (
      <div className="flex items-center justify-center h-[350px]">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis
          dataKey="name"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip 
          formatter={(value, name) => [`$${value}`, name === 'total' ? 'Pagos Totales' : 'Pagos Pendientes']}
          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}
        />
        <Legend />
        <Bar
          dataKey="total"
          name="Pagos Totales"
          fill={COLORS.total}
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="pending"
          name="Pagos Pendientes"
          fill={COLORS.pending}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
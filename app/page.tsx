"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowDown, 
  ArrowUp, 
  DollarSign, 
  Users, 
  CreditCard, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Activity,
  Calendar,
  CheckCircle2,
  Building2
} from "lucide-react";
import { Overview } from "@/components/dashboard/overview";
import { RecentPayments } from "@/components/dashboard/recent-payments";
import { PendingPayments } from "@/components/dashboard/pending-payments";
import { useToast } from "@/components/ui/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type DashboardStats = {
  totalResidents: number;
  newResidentsThisMonth: number;
  activeTokens: number;
  newTokensThisMonth: number;
  currentMonthTotal: number;
  percentageChange: number;
  pendingPayments: number;
  pendingPercentageChange: number;
  pendingPaymentsCount: number;
  pendingPaymentsTotal: number;
};

type Activity = {
  id: number;
  residentId: number;
  residentName: string;
  noRegistro: string;
  amount: number;
  paymentDate: string;
};

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      if (!res.ok) throw new Error("Error al cargar los datos del dashboard");
      const data = await res.json();
      setStats(data.stats);
      setActivities(data.activities);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Cargando dashboard...</div>;
  }

  if (!stats) {
    return <div>No se pudieron cargar los datos</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido al sistema de gestión de residentes
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Residentes</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {stats.totalResidents}
            </div>
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <TrendingUp className="h-3 w-3" />
              <span>+{stats.newResidentsThisMonth} este mes</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/50 dark:to-purple-800/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens Activos</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {stats.activeTokens}
            </div>
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <Activity className="h-3 w-3" />
              <span>+{stats.newTokensThisMonth} este mes</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/50 dark:to-amber-800/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              {stats.pendingPaymentsCount}
            </div>
            <div className="text-sm text-amber-600 dark:text-amber-400">
              Total: ${stats.pendingPaymentsTotal.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/50 dark:bg-muted/20">
          <TabsTrigger value="overview" className="data-[state=active]:bg-background">
            <Activity className="mr-2 h-4 w-4" />
            Vista General
          </TabsTrigger>
          <TabsTrigger value="recent" className="data-[state=active]:bg-background">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Pagos Recientes
          </TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-background">
            <Clock className="mr-2 h-4 w-4" />
            Pagos Pendientes
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Resumen de Pagos</CardTitle>
                <CardDescription>
                  Distribución mensual de pagos del año actual
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Actividades Recientes</CardTitle>
                <CardDescription>
                  Últimas actualizaciones del sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4">
                      <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                        <Calendar className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          Pago recibido de {activity.residentName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.paymentDate), { 
                            addSuffix: true,
                            locale: es 
                          })}
                        </p>
                      </div>
                      <div className="font-medium text-green-600 dark:text-green-400">
                        ${activity.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="recent" className="space-y-4">
          <RecentPayments />
        </TabsContent>
        <TabsContent value="pending" className="space-y-4">
          <PendingPayments />
        </TabsContent>
      </Tabs>
    </div>
  );
}
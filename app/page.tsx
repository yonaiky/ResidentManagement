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
  Building2,
  Eye,
  Plus,
  BarChart3
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Footer } from "@/components/ui/footer";
import { Overview } from "@/components/dashboard/overview";
import { RecentPayments } from "@/components/dashboard/recent-payments";
import { PendingPayments } from "@/components/dashboard/pending-payments";

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
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 pt-20 md:p-8 md:pt-20 lg:p-12 lg:pt-24">
            <div className="mx-auto max-w-7xl animate-fade-in">
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground">Cargando dashboard...</p>
                </div>
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 pt-20 md:p-8 md:pt-20 lg:p-12 lg:pt-24">
            <div className="mx-auto max-w-7xl animate-fade-in">
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No se pudieron cargar los datos</h3>
                <p className="text-muted-foreground mb-4">Hubo un problema al cargar la información del dashboard</p>
                <Button onClick={fetchDashboardData}>Reintentar</Button>
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 pt-20 md:p-8 md:pt-20 lg:p-12 lg:pt-24">
          <div className="mx-auto max-w-7xl animate-fade-in">
            <div className="flex flex-col gap-8">
              {/* Header Section */}
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                    Dashboard
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Bienvenido al sistema de gestión de residentes
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" asChild>
                    <Link href="/residents">
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Residentes
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/residents/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Nuevo Residente
                    </Link>
                  </Button>
                </div>
              </div>
              
              {/* Stats Cards */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="card-hover bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100 dark:from-blue-950/50 dark:via-blue-900/30 dark:to-blue-800/50 border-blue-200/50 dark:border-blue-800/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Total Residentes
                    </CardTitle>
                    <div className="rounded-full bg-blue-500/10 p-2">
                      <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                      {stats.totalResidents}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="h-3 w-3" />
                        <span className="font-medium">+{stats.newResidentsThisMonth}</span>
                      </div>
                      <span className="text-muted-foreground">este mes</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="card-hover bg-gradient-to-br from-purple-50 via-purple-50 to-purple-100 dark:from-purple-950/50 dark:via-purple-900/30 dark:to-purple-800/50 border-purple-200/50 dark:border-purple-800/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      Tokens Activos
                    </CardTitle>
                    <div className="rounded-full bg-purple-500/10 p-2">
                      <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-2">
                      {stats.activeTokens}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <Activity className="h-3 w-3" />
                        <span className="font-medium">+{stats.newTokensThisMonth}</span>
                      </div>
                      <span className="text-muted-foreground">este mes</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-hover bg-gradient-to-br from-emerald-50 via-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:via-emerald-900/30 dark:to-emerald-800/50 border-emerald-200/50 dark:border-emerald-800/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      Ingresos del Mes
                    </CardTitle>
                    <div className="rounded-full bg-emerald-500/10 p-2">
                      <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100 mb-2">
                      ${stats.currentMonthTotal.toFixed(2)}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`flex items-center gap-1 ${stats.percentageChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {stats.percentageChange >= 0 ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )}
                        <span className="font-medium">{Math.abs(stats.percentageChange).toFixed(1)}%</span>
                      </div>
                      <span className="text-muted-foreground">vs mes anterior</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-hover bg-gradient-to-br from-amber-50 via-amber-50 to-amber-100 dark:from-amber-950/50 dark:via-amber-900/30 dark:to-amber-800/50 border-amber-200/50 dark:border-amber-800/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">
                      Pagos Pendientes
                    </CardTitle>
                    <div className="rounded-full bg-amber-500/10 p-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-amber-900 dark:text-amber-100 mb-2">
                      {stats.pendingPaymentsCount}
                    </div>
                    <div className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                      Total: ${stats.pendingPaymentsTotal.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Main Content Tabs */}
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Vista General
                  </TabsTrigger>
                  <TabsTrigger value="recent" className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Pagos Recientes
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Pendientes
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-6">
                  <div className="grid gap-6 lg:grid-cols-7">
                    <Card className="lg:col-span-4 card-hover">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <div className="rounded-lg bg-primary/10 p-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                          </div>
                          Resumen de Pagos
                        </CardTitle>
                        <CardDescription>
                          Distribución mensual de pagos del año actual
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pl-2">
                        <Overview />
                      </CardContent>
                    </Card>
                    
                    <Card className="lg:col-span-3 card-hover">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <div className="rounded-lg bg-emerald-500/10 p-2">
                            <Calendar className="h-5 w-5 text-emerald-600" />
                          </div>
                          Actividades Recientes
                        </CardTitle>
                        <CardDescription>
                          Últimas actualizaciones del sistema
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {activities.length > 0 ? activities.map((activity) => (
                            <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                              <div className="rounded-full bg-emerald-100 p-2 dark:bg-emerald-900/30">
                                <DollarSign className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
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
                              <div className="text-right">
                                <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                                  ${activity.amount.toFixed(2)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  #{activity.noRegistro}
                                </div>
                              </div>
                            </div>
                          )) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>No hay actividades recientes</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="recent" className="space-y-6">
                  <RecentPayments />
                </TabsContent>
                
                <TabsContent value="pending" className="space-y-6">
                  <PendingPayments />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
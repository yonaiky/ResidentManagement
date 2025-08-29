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
  BarChart3,
  Heart,
  Package
} from "lucide-react";
import { Overview } from "@/components/dashboard/overview";
import { RecentPayments } from "@/components/dashboard/recent-payments";
import { PendingPayments } from "@/components/dashboard/pending-payments";
import { useToast } from "@/components/ui/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { Footer } from '@/components/ui/footer';

type DashboardStats = {
  totalClients: number;
  newClientsThisMonth: number;
  activePlans: number;
  newPlansThisMonth: number;
  currentMonthTotal: number;
  percentageChange: number;
  pendingPayments: number;
  pendingPercentageChange: number;
  pendingPaymentsCount: number;
  pendingPaymentsTotal: number;
  totalCaskets: number;
  availableCaskets: number;
  totalFamilyMembers: number;
  newFamilyMembersThisMonth: number;
};

type Activity = {
  id: number;
  clientId: number;
  clientName: string;
  cedula: string;
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

     return (
     <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
       <Header />
       <div className="flex flex-1">
         <Sidebar />
         <main className="flex-1 p-4 pt-20 md:p-8 md:pt-20 lg:p-12 lg:pt-24">
           <div className="mx-auto max-w-7xl animate-fade-in">
             <div className="flex flex-col gap-6">
               {/* Header Section */}
               <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                 <div className="space-y-2">
                   <h1 className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-gradient">
                     Dashboard
                   </h1>
                   <p className="text-lg text-gray-600 dark:text-slate-400">
                     Resumen general de la funeraria
                   </p>
                 </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="btn-modern" asChild>
                    <Link href="/clients/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Nuevo Cliente
                    </Link>
                  </Button>
                  <Button className="btn-modern" asChild>
                    <Link href="/plans/new">
                      <Heart className="mr-2 h-4 w-4" />
                      Nuevo Plan
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid-responsive-3">
                                 <Card className="card-hover">
                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                     <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gradient">Total Clientes</CardTitle>
                     <div className="p-2 rounded-lg bg-blue-100 dark:bg-gradient-to-r dark:from-blue-500/10 dark:to-purple-500/10">
                       <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                     </div>
                   </CardHeader>
                   <CardContent>
                     <div className="text-3xl font-bold text-gray-900 dark:text-gradient">{stats?.totalClients || 0}</div>
                     <p className="text-sm text-gray-600 dark:text-slate-400">
                       +{stats?.newClientsThisMonth || 0} este mes
                     </p>
                   </CardContent>
                 </Card>

                                 <Card className="card-hover">
                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                     <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gradient">Planes Activos</CardTitle>
                     <div className="p-2 rounded-lg bg-pink-100 dark:bg-gradient-to-r dark:from-pink-500/10 dark:to-rose-500/10">
                       <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                     </div>
                   </CardHeader>
                   <CardContent>
                     <div className="text-3xl font-bold text-gray-900 dark:text-gradient">{stats?.activePlans || 0}</div>
                     <p className="text-sm text-gray-600 dark:text-slate-400">
                       +{stats?.newPlansThisMonth || 0} este mes
                     </p>
                   </CardContent>
                 </Card>

                                 <Card className="card-hover">
                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                     <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gradient">Ingresos del Mes</CardTitle>
                     <div className="p-2 rounded-lg bg-green-100 dark:bg-gradient-to-r dark:from-emerald-500/10 dark:to-teal-500/10">
                       <DollarSign className="h-5 w-5 text-green-600 dark:text-emerald-400" />
                     </div>
                   </CardHeader>
                   <CardContent>
                     <div className="text-3xl font-bold text-green-700 dark:text-gradient-success">
                       ${stats?.currentMonthTotal?.toLocaleString() || 0}
                     </div>
                     <p className="text-sm text-gray-600 dark:text-slate-400 flex items-center">
                       {stats?.percentageChange && stats.percentageChange > 0 ? (
                         <ArrowUp className="mr-1 h-4 w-4 text-green-600" />
                       ) : (
                         <ArrowDown className="mr-1 h-4 w-4 text-red-600" />
                       )}
                       {Math.abs(stats?.percentageChange || 0)}% vs mes anterior
                     </p>
                   </CardContent>
                 </Card>

                                 <Card className="card-hover">
                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                     <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gradient">Ataúdes Disponibles</CardTitle>
                     <div className="p-2 rounded-lg bg-amber-100 dark:bg-gradient-to-r dark:from-amber-500/10 dark:to-orange-500/10">
                       <Package className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                     </div>
                   </CardHeader>
                   <CardContent>
                     <div className="text-3xl font-bold text-amber-700 dark:text-gradient-warning">{stats?.availableCaskets || 0}</div>
                     <p className="text-sm text-gray-600 dark:text-slate-400">
                       de {stats?.totalCaskets || 0} en inventario
                     </p>
                   </CardContent>
                 </Card>
              </div>

              {/* Main Content */}
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="overview">Resumen</TabsTrigger>
                  <TabsTrigger value="payments">Pagos Recientes</TabsTrigger>
                  <TabsTrigger value="pending">Pagos Pendientes</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4">
                      <CardHeader>
                        <CardTitle>Ingresos Mensuales</CardTitle>
                        <CardDescription>
                          Resumen de ingresos y pagos pendientes por mes
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pl-2">
                        <Overview />
                      </CardContent>
                    </Card>

                    <Card className="col-span-3">
                      <CardHeader>
                        <CardTitle>Actividad Reciente</CardTitle>
                        <CardDescription>
                          Últimos pagos registrados
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {activities.slice(0, 5).map((activity) => (
                            <div key={activity.id} className="flex items-center space-x-4">
                              <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                              </div>
                              <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium leading-none">
                                  {activity.clientName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {activity.cedula}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">
                                  ${activity.amount.toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(activity.paymentDate), { 
                                    addSuffix: true, 
                                    locale: es 
                                  })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="payments" className="space-y-4">
                  <RecentPayments />
                </TabsContent>

                <TabsContent value="pending" className="space-y-4">
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
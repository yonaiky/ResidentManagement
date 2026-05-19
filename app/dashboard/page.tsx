"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { invalidateCache } from "@/lib/client-fetch-cache";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Building2,
  CreditCard,
  DollarSign,
  Plus,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { DashboardBackground } from "@/components/dashboard/dashboard-background";
import { StatCard } from "@/components/dashboard/stat-card";
import { AnalyticsCard } from "@/components/dashboard/analytics-card";
import { DashboardChart } from "@/components/dashboard/dashboard-chart";
import { RevenueAreaChart } from "@/components/dashboard/charts/revenue-area-chart";
import { WeeklyBarChart } from "@/components/dashboard/charts/weekly-bar-chart";
import { PaymentDonutChart } from "@/components/dashboard/charts/payment-donut-chart";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { PaymentWidget } from "@/components/dashboard/payment-widget";
import { RecentResidentsWidget } from "@/components/dashboard/recent-residents-widget";
import { OccupancyWidget } from "@/components/dashboard/occupancy-widget";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { DASHBOARD_COLORS } from "@/lib/dashboard/constants";
import type { DashboardData } from "@/lib/dashboard/types";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

export default function DashboardPage() {
  const { toast } = useToast();
  const { data, isLoading: loading, refresh } = useApiQuery<DashboardData>(
    "dashboard-stats",
    "/api/dashboard/stats",
    { ttlMs: 45_000 }
  );

  const fetchDashboardData = () => {
    invalidateCache("dashboard-stats");
    void refresh();
  };

  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  if (!data) {
    return (
      <>
        <DashboardBackground />
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <AlertTriangle className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="text-lg font-semibold">No se pudieron cargar los datos</h2>
          <Button className="mt-4" onClick={fetchDashboardData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </div>
      </>
    );
  }

  const { stats } = data;

  return (
    <div className="relative min-w-0 space-y-8">
      <DashboardBackground />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative min-w-0 space-y-8"
      >
        <motion.div
          variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
          className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <p className="text-sm font-medium text-primary">Panel de control</p>
            <h1 className="mt-1 font-[family-name:var(--font-jakarta)] text-3xl font-bold tracking-tight md:text-4xl">
              Dashboard
            </h1>
            <p className="mt-2 max-w-lg text-muted-foreground">
              Vista general de residentes, ingresos y operaciones en tiempo real.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={fetchDashboardData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
            <Button size="sm" className="shadow-lg shadow-primary/25" asChild>
              <Link href="/residents">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo residente
              </Link>
            </Button>
          </div>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total residentes"
            value={stats.totalResidents}
            trend={stats.residentsTrend}
            trendLabel="crecimiento mensual"
            subtitle={`+${stats.newResidentsThisMonth} este mes`}
            icon={Building2}
            gradient="from-blue-500/10 via-blue-500/5 to-transparent dark:from-blue-500/20"
            glow="bg-blue-500/30"
            iconBg="bg-blue-500/15 text-blue-600 dark:text-blue-400"
            sparkline={data.sparklines.residents}
            sparkColor={DASHBOARD_COLORS.primary}
            index={0}
          />
          <StatCard
            title="Tokens activos"
            value={stats.activeTokens}
            trend={stats.tokensTrend}
            trendLabel="vs mes anterior"
            subtitle={`+${stats.newTokensThisMonth} nuevos`}
            icon={CreditCard}
            gradient="from-violet-500/10 via-violet-500/5 to-transparent dark:from-violet-500/20"
            glow="bg-violet-500/30"
            iconBg="bg-violet-500/15 text-violet-600 dark:text-violet-400"
            sparkline={data.sparklines.tokens}
            sparkColor={DASHBOARD_COLORS.secondary}
            index={1}
          />
          <StatCard
            title="Ingresos del mes"
            value={stats.currentMonthTotal}
            format="currency"
            trend={stats.percentageChange}
            trendLabel="vs mes anterior"
            icon={DollarSign}
            gradient="from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/20"
            glow="bg-emerald-500/30"
            iconBg="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            sparkline={data.sparklines.revenue}
            sparkColor={DASHBOARD_COLORS.success}
            index={2}
          />
          <StatCard
            title="Pagos pendientes"
            value={stats.pendingPaymentsCount}
            trend={stats.pendingPercentageChange}
            trendLabel="vs mes anterior"
            subtitle={`Total: $${stats.pendingPaymentsTotal.toFixed(2)}`}
            icon={AlertTriangle}
            gradient="from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/20"
            glow="bg-amber-500/30"
            iconBg="bg-amber-500/15 text-amber-600 dark:text-amber-400"
            sparkline={data.sparklines.pending}
            sparkColor={DASHBOARD_COLORS.warning}
            index={3}
          />
        </div>

        <motion.div className="grid gap-6 lg:grid-cols-3">
          <AnalyticsCard
            title="Ingresos mensuales"
            description="Completados vs pendientes — año actual"
            className="lg:col-span-2"
            delay={0.15}
            action={
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-3.5 w-3.5" />
                {stats.percentageChange >= 0 ? "+" : ""}
                {stats.percentageChange.toFixed(1)}%
              </span>
            }
          >
            <DashboardChart height={300}>
              <RevenueAreaChart data={data.monthlyRevenue} />
            </DashboardChart>
          </AnalyticsCard>

          <AnalyticsCard title="Estado de pagos" description="Distribución global" delay={0.2}>
            <DashboardChart height={240}>
              <PaymentDonutChart data={data.paymentStatus} />
            </DashboardChart>
          </AnalyticsCard>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnalyticsCard
            title="Actividad semanal"
            description="Pagos registrados últimos 7 días"
            delay={0.25}
          >
            <DashboardChart height={220}>
              <WeeklyBarChart data={data.weeklyActivity} />
            </DashboardChart>
          </AnalyticsCard>

          <AnalyticsCard
            title="Ocupación y metas"
            description="Residencial y facturación"
            delay={0.3}
          >
            <OccupancyWidget
              rate={stats.occupancyRate}
              paid={stats.paidResidents}
              total={stats.totalResidents}
              monthlyGoal={stats.monthlyGoal}
              monthlyProgress={stats.monthlyGoalProgress}
              currentRevenue={stats.currentMonthTotal}
            />
          </AnalyticsCard>

          <AnalyticsCard title="Acciones rápidas" delay={0.35}>
            <QuickActions />
          </AnalyticsCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <AnalyticsCard
            title="Actividad reciente"
            description="Últimos pagos registrados"
            delay={0.4}
          >
            <ActivityFeed activities={data.activities} />
          </AnalyticsCard>

          <AnalyticsCard
            title="Próximos pagos"
            description="Residentes con saldo pendiente"
            delay={0.45}
          >
            <PaymentWidget pending={data.pendingResidents} />
          </AnalyticsCard>

          <AnalyticsCard title="Residentes recientes" description="Últimos registros" delay={0.5}>
            <RecentResidentsWidget residents={data.recentResidents} />
          </AnalyticsCard>
        </div>
      </motion.div>
    </div>
  );
}

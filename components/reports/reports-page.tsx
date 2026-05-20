"use client";

import { Suspense, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  FileDown,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";
import { useReportsFilters } from "@/hooks/use-reports-filters";
import { invalidateCache } from "@/lib/client-fetch-cache";
import { exportReportToCsv, exportReportToPdf } from "@/lib/reports/export";
import type { ReportsResponse } from "@/lib/reports/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { AnalyticsCard } from "@/components/dashboard/analytics-card";
import { DashboardChart } from "@/components/dashboard/dashboard-chart";
import { RevenueAreaChart } from "@/components/dashboard/charts/revenue-area-chart";
import { PaymentDonutChart } from "@/components/dashboard/charts/payment-donut-chart";
import { ReportsFiltersPanel } from "./reports-filters";
import { ReportsResultsTable } from "./reports-results-table";
import { ReportsSummaryCards } from "./reports-summary-cards";

function ReportsPageContent() {
  const { toast } = useToast();
  const {
    filters,
    activeDraft,
    apiUrl,
    updateDraft,
    applyFilters,
    resetFilters,
    setPage,
    hasActiveFilters,
  } = useReportsFilters();

  const cacheKey = `reports-${apiUrl}`;
  const { data, isLoading, refresh } = useApiQuery<ReportsResponse>(cacheKey, apiUrl, {
    ttlMs: 30_000,
  });

  const handleRefresh = () => {
    invalidateCache(cacheKey);
    void refresh();
  };

  const handleExportCsv = useCallback(() => {
    if (!data) return;
    exportReportToCsv(data);
    toast({ title: "Exportado", description: "Archivo CSV descargado." });
  }, [data, toast]);

  const handleExportPdf = useCallback(async () => {
    if (!data) return;
    try {
      await exportReportToPdf(data);
      toast({ title: "Exportado", description: "Archivo PDF descargado." });
    } catch {
      toast({
        title: "Error",
        description: "No se pudo generar el PDF.",
        variant: "destructive",
      });
    }
  }, [data, toast]);

  const chartData = data?.monthlyBreakdown.map((m) => ({
    month: m.month,
    label: m.label,
    revenue: m.revenue,
    pending: m.pending,
  }));

  const donutData = data?.statusBreakdown.map((s) => ({
    name: s.name,
    value: s.value,
    fill: s.fill,
  }));

  return (
    <div className="relative min-w-0 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Análisis operativo</p>
          <h1 className="page-title mt-1">Reportes</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Consulta pagos, residentes, accesos y morosidad con filtros profesionales
            para la administración de tu residencial.
          </p>
          {data?.generatedAt && (
            <p className="mt-2 text-xs text-muted-foreground">
              Última actualización:{" "}
              {format(new Date(data.generatedAt), "dd MMM yyyy, HH:mm", { locale: es })}
              {data.dateRange.from && data.dateRange.to && (
                <>
                  {" "}
                  · Período:{" "}
                  {format(new Date(data.dateRange.from), "dd/MM/yyyy")} –{" "}
                  {format(new Date(data.dateRange.to), "dd/MM/yyyy")}
                </>
              )}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={!data?.rows.length}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleExportPdf()}
            disabled={!data?.rows.length}
          >
            <FileDown className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      <ReportsFiltersPanel
        draft={activeDraft}
        onChange={updateDraft}
        onApply={applyFilters}
        onReset={resetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {data && (
        <ReportsSummaryCards summary={data.summary} reportType={filters.reportType} />
      )}

      {chartData && chartData.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-3">
          <AnalyticsCard
            title="Tendencia del período"
            description="Evolución según filtros aplicados"
            className="lg:col-span-2"
          >
            <DashboardChart height={280}>
              <RevenueAreaChart data={chartData} />
            </DashboardChart>
          </AnalyticsCard>

          {donutData && donutData.length > 0 && (
            <AnalyticsCard title="Distribución" description="Por estado">
              <DashboardChart height={240}>
                <PaymentDonutChart data={donutData} />
              </DashboardChart>
            </AnalyticsCard>
          )}
        </div>
      )}

      <AnalyticsCard
        title="Resultados"
        description={
          data
            ? `${data.pagination.total} registro(s) · Página ${data.pagination.page} de ${data.pagination.totalPages}`
            : "Aplica filtros para ver datos"
        }
        action={
          data && data.pagination.totalPages > 1 ? (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={data.pagination.page <= 1}
                onClick={() => setPage(data.pagination.page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[4rem] text-center text-xs text-muted-foreground">
                {data.pagination.page} / {data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={data.pagination.page >= data.pagination.totalPages}
                onClick={() => setPage(data.pagination.page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : undefined
        }
      >
        <ReportsResultsTable
          reportType={filters.reportType}
          rows={data?.rows ?? []}
          loading={isLoading && !data}
        />
      </AnalyticsCard>
    </div>
  );
}

export function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          Cargando reportes...
        </div>
      }
    >
      <ReportsPageContent />
    </Suspense>
  );
}

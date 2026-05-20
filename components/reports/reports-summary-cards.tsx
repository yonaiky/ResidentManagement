"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  Building2,
  DollarSign,
  KeyRound,
  Percent,
  Receipt,
} from "lucide-react";
import type { ReportType, ReportsSummary } from "@/lib/reports/types";

type ReportsSummaryCardsProps = {
  summary: ReportsSummary;
  reportType: ReportType;
};

function formatCurrency(value: number) {
  return value.toLocaleString("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 0,
  });
}

export function ReportsSummaryCards({ summary, reportType }: ReportsSummaryCardsProps) {
  const cards =
    reportType === "tokens"
      ? [
          {
            label: "Total registros",
            value: String(summary.totalRecords),
            sub: "Tokens en el período",
            icon: KeyRound,
            tone: "text-violet-600 dark:text-violet-400",
            bg: "bg-violet-500/10",
          },
          {
            label: "Tokens activos",
            value: String(summary.activeTokens ?? 0),
            sub: "Accesos vigentes",
            icon: KeyRound,
            tone: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Tasa activos",
            value: `${summary.collectionRate}%`,
            sub: "Del total filtrado",
            icon: Percent,
            tone: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-500/10",
          },
        ]
      : reportType === "arrears"
        ? [
            {
              label: "Residentes en mora",
              value: String(summary.totalRecords),
              sub: "Con saldo pendiente",
              icon: AlertTriangle,
              tone: "text-amber-600 dark:text-amber-400",
              bg: "bg-amber-500/10",
            },
            {
              label: "Monto en riesgo",
              value: formatCurrency(summary.totalAmount),
              sub: "Por cobrar",
              icon: DollarSign,
              tone: "text-red-600 dark:text-red-400",
              bg: "bg-red-500/10",
            },
            {
              label: "Promedio por residente",
              value: formatCurrency(summary.averageAmount),
              sub: "Deuda promedio",
              icon: Receipt,
              tone: "text-orange-600 dark:text-orange-400",
              bg: "bg-orange-500/10",
            },
          ]
        : reportType === "residents"
          ? [
              {
                label: "Residentes",
                value: String(summary.totalRecords),
                sub: "Coinciden con filtros",
                icon: Building2,
                tone: "text-blue-600 dark:text-blue-400",
                bg: "bg-blue-500/10",
              },
              {
                label: "Cobrado",
                value: formatCurrency(summary.completedAmount),
                sub: "Pagos completados",
                icon: DollarSign,
                tone: "text-emerald-600 dark:text-emerald-400",
                bg: "bg-emerald-500/10",
              },
              {
                label: "Pendiente",
                value: formatCurrency(summary.pendingAmount),
                sub: "Por cobrar",
                icon: AlertTriangle,
                tone: "text-amber-600 dark:text-amber-400",
                bg: "bg-amber-500/10",
              },
              {
                label: "Tasa de cobro",
                value: `${summary.collectionRate}%`,
                sub: "Residentes al día",
                icon: Percent,
                tone: "text-violet-600 dark:text-violet-400",
                bg: "bg-violet-500/10",
              },
            ]
          : [
              {
                label: "Transacciones",
                value: String(summary.totalRecords),
                sub: "Registros encontrados",
                icon: Receipt,
                tone: "text-blue-600 dark:text-blue-400",
                bg: "bg-blue-500/10",
              },
              {
                label: "Ingresos",
                value: formatCurrency(summary.completedAmount),
                sub: "Pagos completados",
                icon: DollarSign,
                tone: "text-emerald-600 dark:text-emerald-400",
                bg: "bg-emerald-500/10",
              },
              {
                label: "Pendiente",
                value: formatCurrency(summary.pendingAmount),
                sub: "Por cobrar",
                icon: AlertTriangle,
                tone: "text-amber-600 dark:text-amber-400",
                bg: "bg-amber-500/10",
              },
              {
                label: "Tasa de cobro",
                value: `${summary.collectionRate}%`,
                sub: "Del monto filtrado",
                icon: Percent,
                tone: "text-violet-600 dark:text-violet-400",
                bg: "bg-violet-500/10",
              },
            ];

  return (
    <motion.div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <motion.div>
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight">{card.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
            </motion.div>
            <motion.div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bg}`}
            >
              <card.icon className={`h-5 w-5 ${card.tone}`} />
            </motion.div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DATE_PRESETS, MONTH_OPTIONS } from "@/lib/reports/constants";
import type { PaymentReportRow, ReportsResponse } from "@/lib/reports/types";
import { PDF_THEME } from "./theme";

export function orEmpty(value: string | null | undefined): string {
  if (value == null || String(value).trim() === "") return "—";
  return String(value);
}

export function formatCurrencyDOP(amount: number): string {
  return `RD$ ${amount.toLocaleString("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDatePdf(isoOrDate: string | Date | null | undefined): string {
  if (!isoOrDate) return "—";
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "dd/MM/yyyy");
}

export function formatDateTimePdf(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "dd/MM/yyyy HH:mm", { locale: es });
}

export type PaymentStatusKey = string;

export function translatePaymentStatus(status: PaymentStatusKey): string {
  const key = status.toLowerCase();
  switch (key) {
    case "completed":
    case "paid":
      return "Pagado";
    case "pending":
      return "Pendiente";
    case "overdue":
      return "Vencido";
    case "failed":
      return "Fallido";
    case "rejected":
      return "Rechazado";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

export function getPaymentStatusStyle(status: PaymentStatusKey) {
  const key = status.toLowerCase();
  if (key === "completed" || key === "paid") return PDF_THEME.status.success;
  if (key === "pending") return PDF_THEME.status.warning;
  if (key === "overdue" || key === "failed" || key === "rejected") return PDF_THEME.status.danger;
  return PDF_THEME.status.neutral;
}

export function formatReportPeriod(data: ReportsResponse): string {
  const { filters, dateRange } = data;

  if (filters.month !== "all" && filters.year !== "all") {
    const monthLabel = MONTH_OPTIONS.find((m) => m.value === filters.month)?.label;
    return `${monthLabel ?? filters.month} ${filters.year}`;
  }

  if (dateRange.from && dateRange.to) {
    return `${formatDatePdf(dateRange.from)} – ${formatDatePdf(dateRange.to)}`;
  }

  const preset = DATE_PRESETS.find((p) => p.value === filters.datePreset);
  return preset?.label ?? "Todo el historial";
}

export function paymentRowToTableCells(row: PaymentReportRow): string[] {
  return [
    orEmpty(row.residentName),
    orEmpty(row.noRegistro),
    orEmpty(row.cedula),
    orEmpty(`${row.monthName} ${row.year}`),
    formatCurrencyDOP(row.amount),
    translatePaymentStatus(row.status),
    formatDatePdf(row.paymentDate),
    formatDatePdf(row.dueDate),
  ];
}

export const PAYMENT_TABLE_HEADERS = [
  "Residente",
  "No. Registro",
  "Cédula",
  "Período",
  "Monto",
  "Estado",
  "Fecha de pago",
  "Vencimiento",
] as const;

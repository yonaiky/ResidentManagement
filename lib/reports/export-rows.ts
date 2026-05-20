import { format } from "date-fns";
import type { ReportRow } from "./types";
import { formatCurrencyDOP, formatDatePdf, orEmpty, translatePaymentStatus } from "./pdf/formatters";

export function paymentHeaders() {
  return [
    "Residente",
    "No. Registro",
    "Cédula",
    "Período",
    "Monto",
    "Estado",
    "Fecha pago",
    "Vencimiento",
  ];
}

export function paymentRow(row: ReportRow) {
  if (!("residentName" in row && "monthName" in row)) return [];
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

export function residentHeaders() {
  return [
    "Nombre",
    "Cédula",
    "Registro",
    "Teléfono",
    "Estado",
    "Total pagado",
    "Pendiente",
    "Tokens activos",
  ];
}

export function residentRow(row: ReportRow) {
  if (!("phone" in row && "totalPaid" in row)) return [];
  return [
    orEmpty(row.name),
    orEmpty(row.cedula),
    orEmpty(row.noRegistro),
    orEmpty(row.phone),
    translatePaymentStatus(row.paymentStatus),
    formatCurrencyDOP(row.totalPaid),
    formatCurrencyDOP(row.pendingAmount),
    String(row.activeTokens),
  ];
}

export function tokenHeaders() {
  return ["Token", "Estado", "Residente", "No. Registro", "Fecha alta"];
}

export function tokenRow(row: ReportRow) {
  if (!("name" in row && "residentName" in row && !("cedula" in row))) return [];
  return [
    orEmpty(row.name),
    translatePaymentStatus(row.status),
    orEmpty(row.residentName),
    orEmpty(row.noRegistro),
    formatDatePdf(row.createdAt),
  ];
}

export function arrearsHeaders() {
  return [
    "Residente",
    "Cédula",
    "Registro",
    "Teléfono",
    "Monto pendiente",
    "Vencimiento más antiguo",
    "Cuotas vencidas",
    "Estado",
  ];
}

export function arrearsRow(row: ReportRow) {
  if (!("pendingAmount" in row && "overdueCount" in row)) return [];
  return [
    orEmpty(row.residentName),
    orEmpty(row.cedula),
    orEmpty(row.noRegistro),
    orEmpty(row.phone),
    formatCurrencyDOP(row.pendingAmount),
    formatDatePdf(row.oldestDueDate),
    String(row.overdueCount),
    translatePaymentStatus(row.paymentStatus),
  ];
}

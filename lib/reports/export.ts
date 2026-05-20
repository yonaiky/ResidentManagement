import { format } from "date-fns";
import type { ReportRow, ReportsResponse } from "./types";

function escapeCsv(value: string | number | null | undefined) {
  const str = value == null ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function paymentHeaders() {
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

function paymentRow(row: ReportRow) {
  if (!("residentName" in row && "monthName" in row)) return [];
  return [
    row.residentName,
    row.noRegistro,
    row.cedula,
    `${row.monthName} ${row.year}`,
    row.amount.toFixed(2),
    row.status,
    row.paymentDate ? format(new Date(row.paymentDate), "dd/MM/yyyy") : "",
    format(new Date(row.dueDate), "dd/MM/yyyy"),
  ];
}

function residentHeaders() {
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

function residentRow(row: ReportRow) {
  if (!("phone" in row && "totalPaid" in row)) return [];
  return [
    row.name,
    row.cedula,
    row.noRegistro,
    row.phone,
    row.paymentStatus,
    row.totalPaid.toFixed(2),
    row.pendingAmount.toFixed(2),
    String(row.activeTokens),
  ];
}

function tokenHeaders() {
  return ["Token", "Estado", "Residente", "No. Registro", "Fecha alta"];
}

function tokenRow(row: ReportRow) {
  if (!("name" in row && "residentName" in row && !("cedula" in row))) return [];
  return [
    row.name,
    row.status,
    row.residentName,
    row.noRegistro,
    format(new Date(row.createdAt), "dd/MM/yyyy"),
  ];
}

function arrearsHeaders() {
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

function arrearsRow(row: ReportRow) {
  if (!("pendingAmount" in row && "overdueCount" in row)) return [];
  return [
    row.residentName,
    row.cedula,
    row.noRegistro,
    row.phone,
    row.pendingAmount.toFixed(2),
    row.oldestDueDate ? format(new Date(row.oldestDueDate), "dd/MM/yyyy") : "",
    String(row.overdueCount),
    row.paymentStatus,
  ];
}

export function exportReportToCsv(data: ReportsResponse) {
  const type = data.filters.reportType;
  let headers: string[] = [];
  const lines: string[][] = [];

  switch (type) {
    case "payments":
      headers = paymentHeaders();
      for (const row of data.rows) lines.push(paymentRow(row));
      break;
    case "residents":
      headers = residentHeaders();
      for (const row of data.rows) lines.push(residentRow(row));
      break;
    case "tokens":
      headers = tokenHeaders();
      for (const row of data.rows) lines.push(tokenRow(row));
      break;
    case "arrears":
      headers = arrearsHeaders();
      for (const row of data.rows) lines.push(arrearsRow(row));
      break;
  }

  const csv = [
    headers.map(escapeCsv).join(","),
    ...lines.filter((l) => l.length > 0).map((l) => l.map(escapeCsv).join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `reporte-${type}-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportReportToPdf(data: ReportsResponse) {
  const { default: jsPDF } = await import("jspdf");
  const autoTableModule = await import("jspdf-autotable");
  const autoTable = autoTableModule.default;

  const doc = new jsPDF({ orientation: "landscape" });
  const type = data.filters.reportType;
  const titleMap: Record<string, string> = {
    payments: "Reporte de Pagos",
    residents: "Reporte de Residentes",
    tokens: "Reporte de Tokens",
    arrears: "Reporte de Morosidad",
  };

  doc.setFontSize(16);
  doc.text(titleMap[type] ?? "Reporte", 14, 16);
  doc.setFontSize(10);
  doc.text(`Generado: ${format(new Date(data.generatedAt), "dd/MM/yyyy HH:mm")}`, 14, 24);
  doc.text(`Registros: ${data.pagination.total}`, 14, 30);

  let headers: string[] = [];
  const body: string[][] = [];

  switch (type) {
    case "payments":
      headers = paymentHeaders();
      body.push(...data.rows.map(paymentRow).filter((r) => r.length > 0));
      break;
    case "residents":
      headers = residentHeaders();
      body.push(...data.rows.map(residentRow).filter((r) => r.length > 0));
      break;
    case "tokens":
      headers = tokenHeaders();
      body.push(...data.rows.map(tokenRow).filter((r) => r.length > 0));
      break;
    case "arrears":
      headers = arrearsHeaders();
      body.push(...data.rows.map(arrearsRow).filter((r) => r.length > 0));
      break;
  }

  autoTable(doc, {
    head: [headers],
    body,
    startY: 36,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 99, 235] },
  });

  doc.save(`reporte-${type}-${format(new Date(), "yyyy-MM-dd-HHmm")}.pdf`);
}

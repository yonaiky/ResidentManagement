import { format } from "date-fns";
import type { ReportRow, ReportsResponse } from "./types";
import { fetchFullReportForPdf } from "./pdf/fetch-full-report";
import { generateGenericReportPdf } from "./pdf/generic-report-pdf";
import { generatePaymentsReportPdf } from "./pdf/payments-report-pdf";
import {
  arrearsHeaders,
  arrearsRow,
  paymentHeaders,
  paymentRow,
  residentHeaders,
  residentRow,
  tokenHeaders,
  tokenRow,
} from "./export-rows";

function escapeCsv(value: string | number | null | undefined) {
  const str = value == null ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
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
  const fullData = await fetchFullReportForPdf(data);

  if (fullData.filters.reportType === "payments") {
    await generatePaymentsReportPdf(fullData);
    return;
  }

  await generateGenericReportPdf(fullData);
}

// Re-export row helpers for tests or other modules
export type { ReportRow };

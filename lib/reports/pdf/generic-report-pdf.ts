import { format } from "date-fns";
import type { ReportsResponse } from "@/lib/reports/types";
import { formatDateTimePdf } from "./formatters";
import { PDF_THEME } from "./theme";
import {
  arrearsHeaders,
  arrearsRow,
  paymentHeaders,
  paymentRow,
  residentHeaders,
  residentRow,
  tokenHeaders,
  tokenRow,
} from "../export-rows";

type AutoTableFn = (doc: import("jspdf").jsPDF, options: Record<string, unknown>) => void;

const TITLE_MAP: Record<string, string> = {
  residents: "Reporte de Residentes",
  tokens: "Reporte de Tokens",
  arrears: "Reporte de Morosidad",
};

/** PDF simplificado para tipos de reporte distintos a pagos */
export async function generateGenericReportPdf(data: ReportsResponse): Promise<void> {
  const [{ default: jsPDF }, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const autoTable = autoTableModule.default as AutoTableFn;
  const type = data.filters.reportType;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const margin = 14;

  doc.setFillColor(...PDF_THEME.surfaceAlt);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 28, "F");

  doc.setTextColor(...PDF_THEME.muted);
  doc.setFontSize(9);
  doc.text("Resident Manager", margin, 10);

  doc.setTextColor(...PDF_THEME.text);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(TITLE_MAP[type] ?? "Reporte", margin, 18);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...PDF_THEME.muted);
  doc.text(`Generado: ${formatDateTimePdf(data.generatedAt)}`, margin, 24);
  doc.text(`Registros: ${data.pagination.total}`, margin + 70, 24);

  let headers: string[] = [];
  const body: string[][] = [];

  switch (type) {
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
    default:
      headers = paymentHeaders();
      body.push(...data.rows.map(paymentRow).filter((r) => r.length > 0));
  }

  autoTable(doc, {
    head: [headers],
    body,
    startY: 34,
    margin: { left: margin, right: margin, bottom: 16 },
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: {
      fillColor: PDF_THEME.primaryDark,
      textColor: PDF_THEME.headerText,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: PDF_THEME.surface },
    showHead: "everyPage",
  });

  doc.save(`reporte-${type}-${format(new Date(), "yyyy-MM-dd-HHmm")}.pdf`);
}

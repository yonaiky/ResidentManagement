import { format } from "date-fns";
import type { jsPDF } from "jspdf";
import type { PaymentReportRow, ReportsResponse } from "@/lib/reports/types";
import {
  formatCurrencyDOP,
  formatDateTimePdf,
  formatReportPeriod,
  getPaymentStatusStyle,
  PAYMENT_TABLE_HEADERS,
  paymentRowToTableCells,
  translatePaymentStatus,
} from "./formatters";
import { loadFiscalLogoDataUrl } from "./logo";
import { PDF_LAYOUT, PDF_THEME } from "./theme";

const STATUS_COLUMN_INDEX = 5;
const AMOUNT_COLUMN_INDEX = 4;
const DATE_COLUMN_INDICES = [6, 7];

type AutoTableFn = (
  doc: jsPDF,
  options: Record<string, unknown>
) => void;

export async function generatePaymentsReportPdf(data: ReportsResponse): Promise<void> {
  const [{ default: jsPDF }, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const autoTable = autoTableModule.default as AutoTableFn;

  const paymentRows = data.rows.filter(
    (r): r is PaymentReportRow => "monthName" in r && "residentName" in r
  );
  const statusByRow = paymentRows.map((r) => r.status);

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = PDF_LAYOUT.margin;
  const contentWidth = pageWidth - margin * 2;

  const logoDataUrl = await loadFiscalLogoDataUrl();
  const generatedLabel = formatDateTimePdf(data.generatedAt);
  const periodLabel = formatReportPeriod(data);
  const totalRecords = data.pagination.total;
  const totalPaid = data.summary.completedAmount;

  let cursorY: number = margin;

  cursorY = drawHeader(doc, {
    margin,
    pageWidth,
    contentWidth,
    startY: cursorY,
    logoDataUrl,
    generatedLabel,
    totalRecords,
  });

  cursorY = drawSummaryCards(doc, {
    margin,
    contentWidth,
    startY: cursorY + 4,
    totalRecords,
    totalPaid,
    periodLabel,
    generatedLabel,
  });

  const tableBody = paymentRows.map(paymentRowToTableCells);

  autoTable(doc, {
    head: [PAYMENT_TABLE_HEADERS as unknown as string[]],
    body: tableBody,
    startY: cursorY + 6,
    margin: {
      left: margin,
      right: margin,
      top: margin,
      bottom: PDF_LAYOUT.footerHeight + 6,
    },
    theme: "plain",
    styles: {
      fontSize: PDF_LAYOUT.font.table,
      cellPadding: { top: 3, right: 2.5, bottom: 3, left: 2.5 },
      textColor: PDF_THEME.text,
      lineColor: PDF_THEME.border,
      lineWidth: 0.1,
      valign: "middle",
    },
    headStyles: {
      fillColor: PDF_THEME.primaryDark,
      textColor: PDF_THEME.headerText,
      fontStyle: "bold",
      fontSize: PDF_LAYOUT.font.tableHead,
      halign: "center",
    },
    alternateRowStyles: {
      fillColor: PDF_THEME.surface,
    },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { halign: "center", cellWidth: 22 },
      2: { halign: "center", cellWidth: 26 },
      3: { halign: "center", cellWidth: 28 },
      4: { halign: "right", cellWidth: 26 },
      5: { halign: "center", cellWidth: 22 },
      6: { halign: "center", cellWidth: 26 },
      7: { halign: "center", cellWidth: 26 },
    },
    showHead: "everyPage",
    rowPageBreak: "auto",
    didParseCell: (hookData: {
      section: string;
      column: { index: number };
      row: { index: number };
      cell: {
        styles: Record<string, unknown>;
        text?: string[];
      };
    }) => {
      if (hookData.section === "body" && DATE_COLUMN_INDICES.includes(hookData.column.index)) {
        hookData.cell.styles.halign = "center";
      }
      if (hookData.section === "body" && hookData.column.index === AMOUNT_COLUMN_INDEX) {
        hookData.cell.styles.halign = "right";
        hookData.cell.styles.fontStyle = "bold";
      }
      if (hookData.section === "body" && hookData.column.index === STATUS_COLUMN_INDEX) {
        const rawStatus = statusByRow[hookData.row.index];
        if (rawStatus) {
          const colors = getPaymentStatusStyle(rawStatus);
          hookData.cell.styles.fillColor = colors.bg;
          hookData.cell.styles.textColor = colors.text;
          hookData.cell.styles.fontStyle = "bold";
          hookData.cell.styles.halign = "center";
          hookData.cell.text = [translatePaymentStatus(rawStatus)];
        }
      }
    },
    didDrawPage: (hookData: { pageNumber: number }) => {
      drawFooter(doc, {
        pageWidth,
        pageHeight,
        margin,
        generatedLabel,
        pageNumber: hookData.pageNumber,
      });
    },
  });

  doc.save(`reporte-pagos-${format(new Date(), "yyyy-MM-dd-HHmm")}.pdf`);
}

function drawHeader(
  doc: jsPDF,
  opts: {
    margin: number;
    pageWidth: number;
    contentWidth: number;
    startY: number;
    logoDataUrl: string | null;
    generatedLabel: string;
    totalRecords: number;
  }
): number {
  const { margin, pageWidth, contentWidth, startY, logoDataUrl, generatedLabel, totalRecords } =
    opts;
  const headerBottom = startY + PDF_LAYOUT.headerHeight;

  doc.setFillColor(...PDF_THEME.surfaceAlt);
  doc.roundedRect(margin, startY, contentWidth, PDF_LAYOUT.headerHeight, 2, 2, "F");

  const logoX = margin + 4;
  const logoY = startY + 6;

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "AUTO", logoX, logoY, PDF_LAYOUT.logoSize, PDF_LAYOUT.logoSize);
    } catch {
      drawLogoPlaceholder(doc, logoX, logoY);
    }
  } else {
    drawLogoPlaceholder(doc, logoX, logoY);
  }

  const textX = logoX + PDF_LAYOUT.logoSize + 8;
  doc.setTextColor(...PDF_THEME.muted);
  doc.setFontSize(PDF_LAYOUT.font.meta);
  doc.setFont("helvetica", "normal");
  doc.text("Resident Manager", textX, startY + 11);

  doc.setTextColor(...PDF_THEME.text);
  doc.setFontSize(PDF_LAYOUT.font.title);
  doc.setFont("helvetica", "bold");
  doc.text("Reporte de Pagos", textX, startY + 20);

  doc.setFontSize(PDF_LAYOUT.font.subtitle);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...PDF_THEME.muted);
  const metaRight = pageWidth - margin - 4;
  doc.text(`Generado: ${generatedLabel}`, metaRight, startY + 11, { align: "right" });
  doc.text(`Registros: ${totalRecords}`, metaRight, startY + 18, { align: "right" });

  doc.setDrawColor(...PDF_THEME.border);
  doc.setLineWidth(0.4);
  doc.line(margin, headerBottom + 2, pageWidth - margin, headerBottom + 2);

  return headerBottom + 4;
}

function drawLogoPlaceholder(doc: jsPDF, x: number, y: number) {
  doc.setDrawColor(...PDF_THEME.border);
  doc.setFillColor(...PDF_THEME.white);
  doc.roundedRect(x, y, PDF_LAYOUT.logoSize, PDF_LAYOUT.logoSize, 1.5, 1.5, "FD");
  doc.setFontSize(7);
  doc.setTextColor(...PDF_THEME.muted);
  doc.setFont("helvetica", "normal");
  doc.text("LOGO", x + PDF_LAYOUT.logoSize / 2, y + PDF_LAYOUT.logoSize / 2 + 1, {
    align: "center",
  });
}

function drawSummaryCards(
  doc: jsPDF,
  opts: {
    margin: number;
    contentWidth: number;
    startY: number;
    totalRecords: number;
    totalPaid: number;
    periodLabel: string;
    generatedLabel: string;
  }
): number {
  const { margin, contentWidth, startY, totalRecords, totalPaid, periodLabel, generatedLabel } =
    opts;

  const cards = [
    { label: "Total pagos", value: String(totalRecords) },
    { label: "Monto total pagado", value: formatCurrencyDOP(totalPaid) },
    { label: "Período", value: periodLabel },
    { label: "Fecha de generación", value: generatedLabel },
  ];

  const gap = 4;
  const cardWidth = (contentWidth - gap * (cards.length - 1)) / cards.length;
  const cardHeight = PDF_LAYOUT.summaryHeight;

  cards.forEach((card, index) => {
    const x = margin + index * (cardWidth + gap);
    doc.setFillColor(...PDF_THEME.white);
    doc.setDrawColor(...PDF_THEME.border);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 2, 2, "FD");

    doc.setFillColor(...PDF_THEME.primary);
    doc.rect(x, startY, cardWidth, 1.2, "F");

    doc.setFontSize(PDF_LAYOUT.font.summaryLabel);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...PDF_THEME.muted);
    doc.text(card.label, x + 4, startY + 8);

    doc.setFontSize(PDF_LAYOUT.font.summaryValue);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PDF_THEME.text);

    const maxValueWidth = cardWidth - 8;
    const lines = doc.splitTextToSize(card.value, maxValueWidth);
    doc.text(lines.slice(0, 2), x + 4, startY + 16);
  });

  return startY + cardHeight;
}

function drawFooter(
  doc: jsPDF,
  opts: {
    pageWidth: number;
    pageHeight: number;
    margin: number;
    generatedLabel: string;
    pageNumber: number;
  }
) {
  const { pageWidth, pageHeight, margin, generatedLabel, pageNumber } = opts;
  const footerY = pageHeight - PDF_LAYOUT.footerHeight;
  const totalPages = doc.getNumberOfPages();

  doc.setDrawColor(...PDF_THEME.border);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

  doc.setFontSize(PDF_LAYOUT.font.footer);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...PDF_THEME.muted);

  doc.text("Generado por Resident Manager", margin, footerY + 4);
  doc.text(generatedLabel, pageWidth / 2, footerY + 4, { align: "center" });
  doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - margin, footerY + 4, {
    align: "right",
  });
}

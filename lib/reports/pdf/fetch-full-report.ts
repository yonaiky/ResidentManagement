import { filtersToSearchParams } from "@/lib/reports/filters";
import type { ReportsResponse } from "@/lib/reports/types";

const MAX_PDF_ROWS = 2000;

/** Obtiene todos los registros del reporte para exportación PDF (respeta filtros). */
export async function fetchFullReportForPdf(
  data: ReportsResponse
): Promise<ReportsResponse> {
  const { total } = data.pagination;
  if (total <= data.rows.length) return data;

  const pageSize = Math.min(total, MAX_PDF_ROWS);
  const params = filtersToSearchParams({
    ...data.filters,
    page: 1,
    pageSize,
  });

  const res = await fetch(`/api/reports?${params.toString()}`);
  if (!res.ok) return data;
  return (await res.json()) as ReportsResponse;
}

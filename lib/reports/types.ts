import type {
  DATE_FIELDS,
  DATE_PRESETS,
  REPORT_TYPES,
  SORT_OPTIONS,
} from "./constants";

export type ReportType = (typeof REPORT_TYPES)[number]["value"];
export type DatePreset = (typeof DATE_PRESETS)[number]["value"];
export type DateField = (typeof DATE_FIELDS)[number]["value"];
export type SortBy = (typeof SORT_OPTIONS)[number]["value"];

export type ReportsFilters = {
  reportType: ReportType;
  datePreset: DatePreset;
  dateField: DateField;
  from?: string;
  to?: string;
  month: string;
  year: string;
  paymentStatus: string;
  residentStatus: string;
  tokenStatus: string;
  search: string;
  minAmount: string;
  maxAmount: string;
  sortBy: SortBy;
  sortOrder: "asc" | "desc";
  page: number;
  pageSize: number;
};

export type ReportsSummary = {
  totalRecords: number;
  totalAmount: number;
  completedAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  averageAmount: number;
  collectionRate: number;
  activeTokens?: number;
  residentsAtRisk?: number;
};

export type StatusBreakdownItem = {
  name: string;
  value: number;
  amount?: number;
  fill: string;
};

export type MonthlyBreakdownItem = {
  month: string;
  label: string;
  revenue: number;
  pending: number;
  count: number;
};

export type PaymentReportRow = {
  id: number;
  residentId: number;
  residentName: string;
  cedula: string;
  noRegistro: string;
  amount: number;
  status: string;
  paymentDate: string | null;
  dueDate: string;
  month: number;
  year: number;
  monthName: string;
};

export type ResidentReportRow = {
  id: number;
  name: string;
  cedula: string;
  noRegistro: string;
  phone: string;
  paymentStatus: string;
  lastPaymentDate: string | null;
  nextPaymentDate: string | null;
  totalPaid: number;
  pendingAmount: number;
  activeTokens: number;
  createdAt: string;
};

export type TokenReportRow = {
  id: number;
  name: string;
  status: string;
  residentId: number;
  residentName: string;
  noRegistro: string;
  createdAt: string;
};

export type ArrearsReportRow = {
  id: number;
  residentName: string;
  cedula: string;
  noRegistro: string;
  phone: string;
  pendingAmount: number;
  oldestDueDate: string | null;
  overdueCount: number;
  paymentStatus: string;
};

export type ReportRow =
  | PaymentReportRow
  | ResidentReportRow
  | TokenReportRow
  | ArrearsReportRow;

export type ReportsResponse = {
  summary: ReportsSummary;
  statusBreakdown: StatusBreakdownItem[];
  monthlyBreakdown: MonthlyBreakdownItem[];
  rows: ReportRow[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: ReportsFilters;
  dateRange: { from: string | null; to: string | null };
  generatedAt: string;
};

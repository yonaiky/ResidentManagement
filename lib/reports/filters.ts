import type { Prisma } from "@prisma/client";
import {
  DEFAULT_PAGE_SIZE,
  DATE_FIELDS,
  DATE_PRESETS,
  REPORT_TYPES,
} from "./constants";
import type { DateField, DatePreset, ReportsFilters, ReportType } from "./types";

function parseIntParam(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

export function resolveDateRange(filters: Pick<
  ReportsFilters,
  "datePreset" | "from" | "to" | "month" | "year"
>): { from: Date | null; to: Date | null } {
  const now = new Date();

  if (filters.month !== "all" && filters.year !== "all") {
    const month = parseInt(filters.month, 10);
    const year = parseInt(filters.year, 10);
    if (Number.isFinite(month) && Number.isFinite(year)) {
      return {
        from: new Date(year, month - 1, 1),
        to: endOfDay(new Date(year, month, 0)),
      };
    }
  }

  const preset = filters.datePreset;
  if (preset === "all") return { from: null, to: null };

  if (preset === "custom") {
    const from = filters.from ? startOfDay(new Date(filters.from)) : null;
    const to = filters.to ? endOfDay(new Date(filters.to)) : null;
    if (from && !Number.isNaN(from.getTime()) && to && !Number.isNaN(to.getTime())) {
      return { from, to };
    }
    return { from: null, to: null };
  }

  const today = startOfDay(now);

  switch (preset as DatePreset) {
    case "today":
      return { from: today, to: endOfDay(now) };
    case "week": {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return { from, to: endOfDay(now) };
    }
    case "month":
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: endOfDay(now),
      };
    case "last_month": {
      const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const m = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      return {
        from: new Date(y, m, 1),
        to: endOfDay(new Date(y, m + 1, 0)),
      };
    }
    case "quarter": {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      return {
        from: new Date(now.getFullYear(), quarterStartMonth, 1),
        to: endOfDay(now),
      };
    }
    case "year":
      return {
        from: new Date(now.getFullYear(), 0, 1),
        to: endOfDay(now),
      };
    default:
      return { from: null, to: null };
  }
}

export function parseReportsSearchParams(
  searchParams: URLSearchParams
): ReportsFilters {
  const reportType = searchParams.get("reportType");
  const datePreset = searchParams.get("datePreset");
  const dateField = searchParams.get("dateField");

  const validReportTypes = REPORT_TYPES.map((r) => r.value);
  const validPresets = DATE_PRESETS.map((p) => p.value);
  const validDateFields = DATE_FIELDS.map((d) => d.value);

  return {
    reportType: validReportTypes.includes(reportType as ReportType)
      ? (reportType as ReportType)
      : "payments",
    datePreset: validPresets.includes(datePreset as DatePreset)
      ? (datePreset as DatePreset)
      : "month",
    dateField: validDateFields.includes(dateField as DateField)
      ? (dateField as DateField)
      : "paymentDate",
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    month: searchParams.get("month") ?? "all",
    year: searchParams.get("year") ?? String(new Date().getFullYear()),
    paymentStatus: searchParams.get("paymentStatus") ?? "all",
    residentStatus: searchParams.get("residentStatus") ?? "all",
    tokenStatus: searchParams.get("tokenStatus") ?? "all",
    search: searchParams.get("search") ?? "",
    minAmount: searchParams.get("minAmount") ?? "",
    maxAmount: searchParams.get("maxAmount") ?? "",
    sortBy: (() => {
      const sort = searchParams.get("sortBy");
      if (sort === "amount" || sort === "name") return sort;
      return "date";
    })(),
    sortOrder: searchParams.get("sortOrder") === "asc" ? "asc" : "desc",
    page: parseIntParam(searchParams.get("page"), 1),
    pageSize: Math.min(parseIntParam(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE), 100),
  };
}

export function filtersToSearchParams(filters: ReportsFilters): URLSearchParams {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === "" || value === undefined) return;
    if (key === "page" && value === 1) return;
    params.set(key, String(value));
  });
  return params;
}

function paymentDateWhere(
  dateField: DateField,
  range: { from: Date | null; to: Date | null }
): Prisma.PaymentWhereInput | undefined {
  if (!range.from && !range.to) return undefined;
  const bounds =
    range.from && range.to
      ? { gte: range.from, lte: range.to }
      : range.from
        ? { gte: range.from }
        : { lte: range.to! };

  if (dateField === "dueDate") return { dueDate: bounds };
  if (dateField === "createdAt") return { createdAt: bounds };
  return { paymentDate: bounds };
}

function residentDateWhere(
  dateField: DateField,
  range: { from: Date | null; to: Date | null }
): Prisma.ResidentWhereInput | undefined {
  if (!range.from && !range.to) return undefined;
  const bounds =
    range.from && range.to
      ? { gte: range.from, lte: range.to }
      : range.from
        ? { gte: range.from }
        : { lte: range.to! };

  if (dateField === "dueDate") return { nextPaymentDate: bounds };
  if (dateField === "paymentDate") return { lastPaymentDate: bounds };
  return { createdAt: bounds };
}

export function buildPaymentWhere(
  filters: ReportsFilters,
  range: { from: Date | null; to: Date | null }
): Prisma.PaymentWhereInput {
  const and: Prisma.PaymentWhereInput[] = [];

  const dateClause = paymentDateWhere(filters.dateField, range);
  if (dateClause) and.push(dateClause);

  if (filters.paymentStatus !== "all") {
    and.push({ status: filters.paymentStatus });
  }

  if (filters.month !== "all") {
    and.push({ month: parseInt(filters.month, 10) });
  }
  if (filters.year !== "all") {
    and.push({ year: parseInt(filters.year, 10) });
  }

  const min = parseFloat(filters.minAmount);
  const max = parseFloat(filters.maxAmount);
  if (Number.isFinite(min) || Number.isFinite(max)) {
    and.push({
      amount: {
        ...(Number.isFinite(min) ? { gte: min } : {}),
        ...(Number.isFinite(max) ? { lte: max } : {}),
      },
    });
  }

  if (filters.search.trim()) {
    const q = filters.search.trim();
    and.push({
      resident: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { cedula: { contains: q, mode: "insensitive" } },
          { noRegistro: { contains: q, mode: "insensitive" } },
        ],
      },
    });
  }

  if (filters.residentStatus !== "all") {
    and.push({
      resident: {
        paymentStatus:
          filters.residentStatus === "paid"
            ? { in: ["paid", "completed"] }
            : filters.residentStatus,
      },
    });
  }

  return and.length > 0 ? { AND: and } : {};
}

export function buildResidentWhere(
  filters: ReportsFilters,
  range: { from: Date | null; to: Date | null }
): Prisma.ResidentWhereInput {
  const and: Prisma.ResidentWhereInput[] = [];

  const dateClause = residentDateWhere(filters.dateField, range);
  if (dateClause) and.push(dateClause);

  if (filters.residentStatus !== "all") {
    if (filters.residentStatus === "paid") {
      and.push({ paymentStatus: { in: ["paid", "completed"] } });
    } else {
      and.push({ paymentStatus: filters.residentStatus });
    }
  }

  if (filters.search.trim()) {
    const q = filters.search.trim();
    and.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { cedula: { contains: q, mode: "insensitive" } },
        { noRegistro: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  return and.length > 0 ? { AND: and } : {};
}

export function buildTokenWhere(
  filters: ReportsFilters,
  range: { from: Date | null; to: Date | null }
): Prisma.TokenWhereInput {
  const and: Prisma.TokenWhereInput[] = [];

  if (range.from || range.to) {
    const bounds =
      range.from && range.to
        ? { gte: range.from, lte: range.to }
        : range.from
          ? { gte: range.from }
          : { lte: range.to! };
    and.push({ createdAt: bounds });
  }

  if (filters.tokenStatus !== "all") {
    and.push({ status: filters.tokenStatus });
  }

  if (filters.search.trim()) {
    const q = filters.search.trim();
    and.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        {
          resident: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { noRegistro: { contains: q, mode: "insensitive" } },
            ],
          },
        },
      ],
    });
  }

  if (filters.residentStatus !== "all") {
    and.push({
      resident: {
        paymentStatus:
          filters.residentStatus === "paid"
            ? { in: ["paid", "completed"] }
            : filters.residentStatus,
      },
    });
  }

  return and.length > 0 ? { AND: and } : {};
}

export function buildArrearsWhere(filters: ReportsFilters): Prisma.ResidentWhereInput {
  const and: Prisma.ResidentWhereInput[] = [
    {
      OR: [
        { paymentStatus: { in: ["pending", "overdue"] } },
        {
          payments: {
            some: { status: { in: ["pending", "overdue"] } },
          },
        },
      ],
    },
  ];

  if (filters.residentStatus !== "all" && filters.residentStatus !== "paid") {
    and.push({ paymentStatus: filters.residentStatus });
  }

  if (filters.search.trim()) {
    const q = filters.search.trim();
    and.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { cedula: { contains: q, mode: "insensitive" } },
        { noRegistro: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  return { AND: and };
}

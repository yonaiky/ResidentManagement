"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_PAGE_SIZE } from "@/lib/reports/constants";
import {
  filtersToSearchParams,
  parseReportsSearchParams,
} from "@/lib/reports/filters";
import type { ReportsFilters } from "@/lib/reports/types";

export function useReportsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => parseReportsSearchParams(searchParams),
    [searchParams]
  );

  const [draft, setDraft] = useState<ReportsFilters | null>(null);
  const activeDraft = draft ?? filters;

  const apiUrl = useMemo(() => {
    const params = filtersToSearchParams(filters);
    return `/api/reports?${params.toString()}`;
  }, [filters]);

  const updateDraft = useCallback(
    <K extends keyof ReportsFilters>(key: K, value: ReportsFilters[K]) => {
      setDraft((prev) => ({ ...(prev ?? filters), [key]: value, page: 1 }));
    },
    [filters]
  );

  const applyFilters = useCallback(() => {
    const next = draft ?? filters;
    const params = filtersToSearchParams({ ...next, page: 1 });
    setDraft(null);
    router.push(`/reports?${params.toString()}`);
  }, [draft, filters, router]);

  const resetFilters = useCallback(() => {
    setDraft(null);
    router.push("/reports");
  }, [router]);

  const setPage = useCallback(
    (page: number) => {
      const params = filtersToSearchParams({ ...filters, page });
      router.push(`/reports?${params.toString()}`);
    },
    [filters, router]
  );

  const hasActiveFilters =
    filters.datePreset !== "month" ||
    filters.paymentStatus !== "all" ||
    filters.residentStatus !== "all" ||
    filters.tokenStatus !== "all" ||
    filters.search !== "" ||
    filters.minAmount !== "" ||
    filters.maxAmount !== "" ||
    filters.month !== "all" ||
    filters.reportType !== "payments";

  return {
    filters,
    activeDraft,
    apiUrl,
    updateDraft,
    applyFilters,
    resetFilters,
    setPage,
    hasActiveFilters,
    defaultPageSize: DEFAULT_PAGE_SIZE,
  };
}

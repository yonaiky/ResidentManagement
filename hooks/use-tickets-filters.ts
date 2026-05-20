"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  filtersToSearchParams,
  parseTicketSearchParams,
} from "@/lib/tickets/filters";
import type { TicketsFilters } from "@/lib/tickets/types";
import type { TicketsViewMode } from "@/hooks/use-tickets-view-mode";

const TABLE_PAGE_SIZE = 20;
const BOARD_PAGE_SIZE = 100;

export function useTicketsFilters(viewMode: TicketsViewMode = "table") {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => parseTicketSearchParams(searchParams),
    [searchParams]
  );

  const [draft, setDraft] = useState<TicketsFilters | null>(null);
  const activeDraft = draft ?? filters;

  const apiUrl = useMemo(() => {
    const boardFilters: TicketsFilters = {
      ...filters,
      page: 1,
      pageSize: viewMode === "board" ? BOARD_PAGE_SIZE : TABLE_PAGE_SIZE,
      status: viewMode === "board" ? "" : filters.status,
    };
    const params = filtersToSearchParams(boardFilters);
    return `/api/tickets?${params.toString()}`;
  }, [filters, viewMode]);

  const updateDraft = useCallback(
    <K extends keyof TicketsFilters>(key: K, value: TicketsFilters[K]) => {
      setDraft((prev) => ({ ...(prev ?? filters), [key]: value, page: 1 }));
    },
    [filters]
  );

  const applyFilters = useCallback(() => {
    const next = draft ?? filters;
    const params = filtersToSearchParams({ ...next, page: 1 });
    setDraft(null);
    router.push(`/tickets?${params.toString()}`);
  }, [draft, filters, router]);

  const resetFilters = useCallback(() => {
    setDraft(null);
    router.push("/tickets");
  }, [router]);

  const setPage = useCallback(
    (page: number) => {
      const params = filtersToSearchParams({ ...filters, page });
      router.push(`/tickets?${params.toString()}`);
    },
    [filters, router]
  );

  const hasActiveFilters =
    filters.status !== "" ||
    filters.priority !== "" ||
    filters.category !== "" ||
    filters.assignedToId !== "" ||
    filters.unassigned ||
    filters.residentId !== "" ||
    filters.search !== "" ||
    filters.slaBreached ||
    !!filters.from ||
    !!filters.to;

  return {
    filters,
    activeDraft,
    apiUrl,
    updateDraft,
    applyFilters,
    resetFilters,
    setPage,
    hasActiveFilters,
  };
}

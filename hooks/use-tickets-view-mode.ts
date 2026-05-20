"use client";

import { useCallback, useEffect, useState } from "react";

export type TicketsViewMode = "table" | "board";

const STORAGE_KEY = "tickets-view-mode";

export function useTicketsViewMode() {
  const [viewMode, setViewModeState] = useState<TicketsViewMode>("table");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "board" || stored === "table") {
      setViewModeState(stored);
    }
    setHydrated(true);
  }, []);

  const setViewMode = useCallback((mode: TicketsViewMode) => {
    setViewModeState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, []);

  return { viewMode, setViewMode, hydrated };
}

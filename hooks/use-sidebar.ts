"use client";

import { useCallback, useEffect, useMemo } from "react";
import {
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_WIDTH_EXPANDED,
} from "@/lib/navigation/sidebar-config";
import { useSidebarStore } from "@/store/sidebar-store";

export function useSidebar() {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const mobileOpen = useSidebarStore((s) => s.mobileOpen);
  const hydrated = useSidebarStore((s) => s.hydrated);
  const setCollapsed = useSidebarStore((s) => s.setCollapsed);
  const toggleCollapsed = useSidebarStore((s) => s.toggleCollapsed);
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);

  useEffect(() => {
    const unsub = useSidebarStore.persist.onFinishHydration(() => {
      useSidebarStore.getState().setHydrated(true);
    });
    if (useSidebarStore.persist.hasHydrated()) {
      useSidebarStore.getState().setHydrated(true);
    }
    return unsub;
  }, []);

  const width = useMemo(
    () => (collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED),
    [collapsed]
  );

  const closeMobile = useCallback(() => setMobileOpen(false), [setMobileOpen]);
  const openMobile = useCallback(() => setMobileOpen(true), [setMobileOpen]);

  return {
    collapsed,
    mobileOpen,
    hydrated,
    width,
    setCollapsed,
    toggleCollapsed,
    setMobileOpen,
    closeMobile,
    openMobile,
    expandedWidth: SIDEBAR_WIDTH_EXPANDED,
    collapsedWidth: SIDEBAR_WIDTH_COLLAPSED,
  };
}

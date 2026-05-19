"use client";

import { memo, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  filterNavGroupsForRole,
  QUICK_ACTIONS,
  SIDEBAR_NAV_GROUPS,
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_WIDTH_EXPANDED,
} from "@/lib/navigation/sidebar-config";
import { useAuthUserStore } from "@/store/auth-user-store";
import { useSidebar } from "@/hooks/use-sidebar";
import { SidebarFooter } from "./SidebarFooter";
import { SidebarGroup } from "./SidebarGroup";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarSkeleton } from "./SidebarSkeleton";

function SidebarComponent() {
  const { collapsed, hydrated, width, toggleCollapsed } = useSidebar();
  const user = useAuthUserStore((s) => s.user);
  const isLoading = useAuthUserStore((s) => s.isLoading);
  const fetchUser = useAuthUserStore((s) => s.fetchUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const navGroups = useMemo(
    () => filterNavGroupsForRole(SIDEBAR_NAV_GROUPS, user?.role),
    [user?.role]
  );

  const displayWidth = hydrated ? width : SIDEBAR_WIDTH_EXPANDED;

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: displayWidth }}
        transition={{ type: "spring", stiffness: 400, damping: 38 }}
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-dvh max-h-dvh flex-col md:flex",
          "px-3 py-3"
        )}
        aria-label="Barra lateral principal"
      >
        <motion.div className="sidebar-panel" layout>
          <motion.div className="sidebar-noise pointer-events-none absolute inset-0 opacity-[0.35]" />
          <motion.div
            className="sidebar-glow-primary"
            animate={{ opacity: collapsed ? 0.4 : 0.7 }}
          />
          <motion.div
            className="sidebar-glow-secondary"
            animate={{ opacity: collapsed ? 0.3 : 0.6 }}
          />

          <div className="relative flex h-full flex-col">
            <SidebarHeader
              collapsed={collapsed}
              onToggleCollapse={toggleCollapsed}
            />

            <ScrollArea className="sidebar-scroll flex-1 px-2">
              {!hydrated || (isLoading && !user) ? (
                <SidebarSkeleton collapsed={collapsed} />
              ) : (
                <nav className="space-y-6 py-2" aria-label="Navegación principal">
                  {navGroups.map((group, index) => (
                    <SidebarGroup
                      key={group.id}
                      group={group}
                      collapsed={collapsed}
                      index={index}
                    />
                  ))}

                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="px-2 pt-1"
                    >
                      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted">
                        Acceso rápido
                      </p>
                      {QUICK_ACTIONS.map((action) => (
                        <Link
                          key={action.href}
                          href={action.href}
                          prefetch
                          className="flex items-center gap-3 rounded-xl border border-dashed border-sidebar-border px-3 py-2.5 text-sm text-sidebar-muted transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-sidebar-foreground"
                        >
                          <Plus className="h-4 w-4 shrink-0" />
                          <span>{action.label}</span>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </nav>
              )}
            </ScrollArea>

            <SidebarFooter
              user={user}
              collapsed={collapsed}
              isLoading={isLoading && !user}
            />
          </div>
        </motion.div>
      </motion.aside>
    </TooltipProvider>
  );
}

export const Sidebar = memo(SidebarComponent);
export default Sidebar;

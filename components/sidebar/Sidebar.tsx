"use client";

import { memo, useEffect, useMemo } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  filterNavGroupsForRole,
  QUICK_ACTIONS,
  SIDEBAR_NAV_GROUPS,
} from "@/lib/navigation/sidebar-config";
import { useAuthUserStore } from "@/store/auth-user-store";
import { useSidebar } from "@/hooks/use-sidebar";
import { SidebarFooter } from "./SidebarFooter";
import { SidebarGroup } from "./SidebarGroup";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarSkeleton } from "./SidebarSkeleton";

type SidebarProps = {
  className?: string;
};

function SidebarComponent({ className }: SidebarProps) {
  const { collapsed, toggleCollapsed, hydrated } = useSidebar();
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

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn("flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground", className)}>
        <SidebarHeader
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
        />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <nav
            className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-2.5 py-3 [scrollbar-gutter:stable]"
            aria-label="Navegación principal"
          >
            {!hydrated || (isLoading && !user) ? (
              <SidebarSkeleton collapsed={collapsed} />
            ) : (
              <div className="space-y-6">
                {navGroups.map((group, index) => (
                  <SidebarGroup
                    key={group.id}
                    group={group}
                    collapsed={collapsed}
                    index={index}
                  />
                ))}

                {!collapsed && (
                  <div className="px-2 pt-1">
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
                  </div>
                )}
              </div>
            )}
          </nav>

          <SidebarFooter
            user={user}
            collapsed={collapsed}
            isLoading={isLoading && !user}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}

export const Sidebar = memo(SidebarComponent);
export default Sidebar;

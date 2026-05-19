"use client";

import { memo, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  filterNavGroupsForRole,
  QUICK_ACTIONS,
  SIDEBAR_NAV_GROUPS,
} from "@/lib/navigation/sidebar-config";
import { useAuthUserStore } from "@/store/auth-user-store";
import { useSidebar } from "@/hooks/use-sidebar";
import { SidebarGroup } from "./SidebarGroup";
import { SidebarFooter } from "./SidebarFooter";
import { SidebarHeader } from "./SidebarHeader";

function MobileSidebarComponent() {
  const { mobileOpen, closeMobile } = useSidebar();
  const user = useAuthUserStore((s) => s.user);
  const isLoading = useAuthUserStore((s) => s.isLoading);

  const navGroups = useMemo(
    () => filterNavGroupsForRole(SIDEBAR_NAV_GROUPS, user?.role),
    [user?.role]
  );

  return (
    <AnimatePresence>
      {mobileOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Cerrar menú"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-md md:hidden"
            onClick={closeMobile}
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className={cn(
              "fixed inset-y-0 left-0 z-[70] flex w-[min(300px,88vw)] flex-col md:hidden",
              "border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-lg backdrop-blur-xl"
            )}
          >
            <div className="sidebar-noise pointer-events-none absolute inset-0 rounded-r-2xl opacity-40" />
            <div className="relative flex h-full flex-col">
              <div className="flex items-center justify-end p-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={closeMobile}
                  className="h-9 w-9 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <TooltipProvider delayDuration={0}>
                <SidebarHeader
                  collapsed={false}
                  onToggleCollapse={closeMobile}
                />
                <ScrollArea className="flex-1 px-2">
                  <nav className="space-y-6 py-2" aria-label="Navegación móvil">
                    {navGroups.map((group, index) => (
                      <SidebarGroup
                        key={group.id}
                        group={group}
                        collapsed={false}
                        index={index}
                        onNavigate={closeMobile}
                      />
                    ))}
                    <div className="px-2 pt-2">
                      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted">
                        Acceso rápido
                      </p>
                      {QUICK_ACTIONS.map((action) => (
                        <Link
                          key={action.href}
                          href={action.href}
                          prefetch
                          onClick={closeMobile}
                          className="flex items-center gap-3 rounded-xl border border-dashed border-sidebar-border px-3 py-2.5 text-sm text-sidebar-muted transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-sidebar-foreground"
                        >
                          <Plus className="h-4 w-4" />
                          {action.label}
                        </Link>
                      ))}
                    </div>
                  </nav>
                </ScrollArea>
                <SidebarFooter
                  user={user}
                  collapsed={false}
                  isLoading={isLoading}
                />
              </TooltipProvider>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export const MobileSidebar = memo(MobileSidebarComponent);

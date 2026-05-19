"use client";

import Link from "next/link";
import { memo } from "react";
import { motion } from "framer-motion";
import { Building2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarCollapse } from "./SidebarCollapse";

type SidebarHeaderProps = {
  collapsed: boolean;
  onToggleCollapse: () => void;
};

function SidebarHeaderComponent({
  collapsed,
  onToggleCollapse,
}: SidebarHeaderProps) {
  return (
    <motion.div
      className={cn(
        "flex items-center gap-2 border-b border-sidebar-border px-3 py-4",
        collapsed ? "flex-col" : "flex-row"
      )}
      layout
    >
      <Link
        href="/dashboard"
        prefetch
        className={cn(
          "group flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1 outline-none",
          "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          collapsed && "flex-col"
        )}
      >
        <motion.div
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary/90 to-violet-600 shadow-md shadow-primary/30"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
        >
          <Building2 className="relative h-5 w-5 text-primary-foreground" strokeWidth={2} />
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary">
            <Sparkles className="h-2 w-2 text-primary-foreground" />
          </span>
        </motion.div>

        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="min-w-0 flex-1"
          >
            <p className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
              Resident
            </p>
            <p className="truncate text-[11px] font-medium text-sidebar-muted">
              Management
            </p>
          </motion.div>
        )}
      </Link>

      <SidebarCollapse collapsed={collapsed} onToggle={onToggleCollapse} />
    </motion.div>
  );
}

export const SidebarHeader = memo(SidebarHeaderComponent);

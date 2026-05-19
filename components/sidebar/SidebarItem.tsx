"use client";

import Link from "next/link";
import { memo, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SidebarItemProps } from "./types";

function SidebarItemComponent({
  item,
  collapsed,
  isActive,
  onNavigate,
}: SidebarItemProps) {
  const Icon = item.icon;

  const handleClick = useCallback(() => {
    onNavigate?.();
  }, [onNavigate]);

  const content = (
    <Link
      href={item.href}
      prefetch
      onClick={handleClick}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-colors",
        "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        isActive
          ? "text-sidebar-primary-foreground"
          : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {isActive && (
        <motion.span
          layoutId="sidebar-active-pill"
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary via-primary/90 to-violet-600 shadow-md shadow-primary/25"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
      {isActive && (
        <span className="absolute -left-0.5 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.6)]" />
      )}

      <motion.span
        className={cn(
          "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all",
          isActive
            ? "bg-sidebar-primary-foreground/15 text-sidebar-primary-foreground"
            : "bg-sidebar-accent text-sidebar-muted group-hover:bg-sidebar-accent group-hover:text-sidebar-accent-foreground"
        )}
        whileHover={{ scale: 1.05, y: -1 }}
        whileTap={{ scale: 0.97 }}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
      </motion.span>

      {!collapsed && (
        <motion.div
          initial={false}
          animate={{ opacity: 1, x: 0 }}
          className="relative z-10 flex min-w-0 flex-1 flex-col"
        >
          <span className="truncate leading-tight">{item.label}</span>
          {item.description && (
            <span
              className={cn(
                "truncate text-[11px] font-normal leading-tight",
                isActive
                  ? "text-sidebar-primary-foreground/80"
                  : "text-sidebar-muted"
              )}
            >
              {item.description}
            </span>
          )}
        </motion.div>
      )}

      {!collapsed && item.badge != null && (
        <Badge
          variant="secondary"
          className={cn(
            "relative z-10 ml-auto h-5 border-0 px-1.5 text-[10px] font-semibold",
            isActive
              ? "bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground"
              : "bg-primary/15 text-primary"
          )}
        >
          {item.badge}
        </Badge>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent
          side="right"
          className="border-border bg-popover text-popover-foreground"
        >
          <p className="font-medium">{item.label}</p>
          {item.description && (
            <p className="text-xs text-muted-foreground">{item.description}</p>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export const SidebarItem = memo(SidebarItemComponent);

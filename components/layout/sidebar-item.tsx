"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarItemProps = {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  collapsed?: boolean;
};

export function SidebarItem({
  href,
  label,
  icon: Icon,
  isActive,
  collapsed,
}: SidebarItemProps) {
  return (
    <Link href={href} className="relative block">
      {isActive && (
        <motion.span
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-xl bg-primary/10 ring-1 ring-primary/20"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <span
        className={cn(
          "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
          "hover:text-foreground",
          isActive ? "text-primary" : "text-muted-foreground",
          collapsed && "justify-center px-2"
        )}
      >
        <Icon
          className={cn(
            "h-[18px] w-[18px] shrink-0 transition-colors",
            isActive && "text-primary drop-shadow-[0_0_8px_rgba(37,99,235,0.5)]"
          )}
        />
        {!collapsed && <span>{label}</span>}
      </span>
    </Link>
  );
}

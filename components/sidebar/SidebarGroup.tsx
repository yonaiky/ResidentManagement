"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  type SidebarNavGroup,
  isNavItemActive,
} from "@/lib/navigation/sidebar-config";
import { SidebarItem } from "./SidebarItem";

type SidebarGroupProps = {
  group: SidebarNavGroup;
  collapsed: boolean;
  onNavigate?: () => void;
  index?: number;
};

function SidebarGroupComponent({
  group,
  collapsed,
  onNavigate,
  index = 0,
}: SidebarGroupProps) {
  const pathname = usePathname();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.05,
        type: "spring",
        stiffness: 400,
        damping: 30,
      }}
      className="space-y-1"
    >
      {!collapsed && (
        <p
          className={cn(
            "mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em]",
            "text-sidebar-muted"
          )}
        >
          {group.label}
        </p>
      )}
      {collapsed && index > 0 && (
        <motion.div
          className="mx-auto my-2 h-px w-8 bg-gradient-to-r from-transparent via-sidebar-border to-transparent"
          layout
        />
      )}
      <ul className="space-y-0.5" role="list">
        {group.items.map((item) => (
          <li key={item.href}>
            <SidebarItem
              item={item}
              collapsed={collapsed}
              isActive={isNavItemActive(pathname, item.href)}
              onNavigate={onNavigate}
            />
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export const SidebarGroup = memo(SidebarGroupComponent);

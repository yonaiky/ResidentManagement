"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type SidebarCollapseProps = {
  collapsed: boolean;
  onToggle: () => void;
};

function SidebarCollapseComponent({ collapsed, onToggle }: SidebarCollapseProps) {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn(
            "relative h-8 w-8 shrink-0 rounded-lg border border-sidebar-border",
            "bg-sidebar-accent text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
          )}
          aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
        >
          <motion.div
            initial={false}
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </motion.div>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        {collapsed ? "Expandir" : "Contraer"}
      </TooltipContent>
    </Tooltip>
  );
}

export const SidebarCollapse = memo(SidebarCollapseComponent);

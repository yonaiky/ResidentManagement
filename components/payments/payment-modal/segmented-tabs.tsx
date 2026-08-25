"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Calendar, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaymentModalTab } from "./types";

type SegmentedTabsProps = {
  value: PaymentModalTab;
  onChange: (tab: PaymentModalTab) => void;
};

const tabs: { id: PaymentModalTab; label: string; icon: typeof Receipt }[] = [
  { id: "payment", label: "Registrar pago", icon: Receipt },
  { id: "status", label: "Historial", icon: Calendar },
];

function SegmentedTabsComponent({ value, onChange }: SegmentedTabsProps) {
  return (
    <div
      className="relative flex rounded-xl border border-border bg-muted/50 p-1"
      role="tablist"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative z-10 flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <motion.span
                layoutId="payment-modal-tab"
                className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 shadow-lg shadow-blue-500/20"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <Icon className="relative h-4 w-4" />
            <span className="relative hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export const SegmentedTabs = memo(SegmentedTabsComponent);

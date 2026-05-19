"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type AnalyticsCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  delay?: number;
};

export function AnalyticsCard({
  title,
  description,
  children,
  className,
  action,
  delay = 0,
}: AnalyticsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      className={cn(
        "min-w-0 rounded-2xl border border-border bg-card p-6 shadow-sm",
        className
      )}
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold tracking-tight">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </motion.div>
  );
}

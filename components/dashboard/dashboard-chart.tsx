"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type DashboardChartProps = {
  children: ReactNode;
  loading?: boolean;
  height?: number;
  className?: string;
};

export function DashboardChart({
  children,
  loading,
  height = 280,
  className,
}: DashboardChartProps) {
  if (loading) {
    return <Skeleton className={cn("w-full rounded-xl", className)} style={{ height }} />;
  }

  return (
    <div
      className={cn("w-full min-w-0 overflow-hidden", className)}
      style={{ height }}
    >
      {children}
    </div>
  );
}

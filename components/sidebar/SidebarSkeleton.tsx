"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

type SidebarSkeletonProps = {
  collapsed?: boolean;
};

function SidebarSkeletonComponent({ collapsed }: SidebarSkeletonProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-3" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "animate-pulse rounded-xl bg-sidebar-accent",
            collapsed ? "mx-auto h-10 w-10" : "h-11 w-full"
          )}
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}

export const SidebarSkeleton = memo(SidebarSkeletonComponent);

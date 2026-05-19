"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

type PageContentProps = {
  children: React.ReactNode;
  className?: string;
};

function PageContentComponent({ children, className }: PageContentProps) {
  return (
    <div className={cn("flex flex-col gap-8 animate-fade-in", className)}>
      {children}
    </div>
  );
}

export const PageContent = memo(PageContentComponent);

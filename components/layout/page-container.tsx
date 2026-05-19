import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
};

export function PageContainer({
  children,
  className,
  fullWidth = false,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full min-w-0 animate-fade-in",
        !fullWidth && "max-w-[1400px]",
        className
      )}
    >
      {children}
    </div>
  );
}

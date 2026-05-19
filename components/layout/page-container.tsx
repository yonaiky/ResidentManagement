import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
  /** Sin max-width: útil para tablas muy anchas */
  fullWidth?: boolean;
};

export function PageContainer({
  children,
  className,
  fullWidth = false,
}: PageContainerProps) {
  return (
    <div className={cn("relative w-full min-w-0 animate-fade-in", className)}>
      <div
        className={cn(
          "mx-auto w-full min-w-0",
          !fullWidth && "max-w-[min(100rem,100%)]",
          "px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7"
        )}
      >
        {children}
      </div>
    </div>
  );
}

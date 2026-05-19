"use client";

import { memo, useEffect, useState } from "react";
import Header from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { MobileSidebar } from "@/components/sidebar/MobileSidebar";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Footer } from "@/components/ui/footer";
import { CommandPalette } from "@/components/dashboard/command-palette";
import { useSidebar } from "@/hooks/use-sidebar";
import { SIDEBAR_WIDTH_EXPANDED } from "@/lib/navigation/sidebar-config";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
};

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

function AppShellComponent({ children }: AppShellProps) {
  const { hydrated, width } = useSidebar();
  const isDesktop = useIsDesktop();

  const sidebarOffset =
    isDesktop && hydrated ? width : isDesktop ? SIDEBAR_WIDTH_EXPANDED : 0;

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-background">
      <CommandPalette />
      <Sidebar />
      <MobileSidebar />

      {/* Columna principal: padding compensa sidebar fixed (sin margin → sin overflow horizontal) */}
      <div
        className={cn(
          "flex h-full min-w-0 flex-1 flex-col overflow-hidden",
          "transition-[padding-left] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
        )}
        style={{ paddingLeft: sidebarOffset }}
      >
        <Header premium />

        <main
          id="app-main-scroll"
          className="app-main-scroll flex-1 focus:outline-none"
          tabIndex={-1}
        >
          <PageContainer>{children}</PageContainer>
        </main>

        <Footer className="shrink-0 border-t border-border/40 bg-background/50 backdrop-blur-sm" />
      </div>
    </div>
  );
}

export const AppShell = memo(AppShellComponent);

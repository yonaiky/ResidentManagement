"use client";

import { memo } from "react";
import Header from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { MobileSidebar } from "@/components/sidebar/MobileSidebar";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { CommandPalette } from "@/components/dashboard/command-palette";
import { useSidebar } from "@/hooks/use-sidebar";
import { SIDEBAR_WIDTH_EXPANDED } from "@/lib/navigation/sidebar-config";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
};

function AppShellComponent({ children }: AppShellProps) {
  const { hydrated, width } = useSidebar();
  const sidebarWidth = hydrated ? width : SIDEBAR_WIDTH_EXPANDED;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <CommandPalette />
      <MobileSidebar />

      <aside
        className={cn(
          "sticky top-0 z-30 hidden h-screen shrink-0 overflow-hidden border-r border-border bg-sidebar shadow-sm transition-[width] duration-300 ease-out md:block"
        )}
        style={{ width: sidebarWidth }}
        aria-label="Barra lateral principal"
      >
        <Sidebar />
      </aside>

      <main className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Header premium />

        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <PageContainer>{children}</PageContainer>
        </div>
      </main>
    </div>
  );
}

export const AppShell = memo(AppShellComponent);

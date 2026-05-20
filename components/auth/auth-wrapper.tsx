"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { TechnicianRouteGuard } from "@/components/auth/technician-route-guard";

interface AuthWrapperProps {
  children: React.ReactNode;
}

const authRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

const landingRoutes = ["/"];

export function AuthWrapper({ children }: AuthWrapperProps) {
  const pathname = usePathname();
  const isAuthRoute = authRoutes.includes(pathname);
  const isLanding = landingRoutes.includes(pathname);

  if (isAuthRoute || isLanding) {
    return <>{children}</>;
  }

  return (
    <TechnicianRouteGuard>
      <AppShell>{children}</AppShell>
    </TechnicianRouteGuard>
  );
}

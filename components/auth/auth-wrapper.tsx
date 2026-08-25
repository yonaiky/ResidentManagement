"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { TechnicianRouteGuard } from "@/components/auth/technician-route-guard";
import { TenantOnboardingGuard } from "@/components/auth/tenant-onboarding-guard";

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
  const isOnboarding =
    pathname === "/onboarding" || pathname.startsWith("/onboarding/");
  const isPlatform =
    pathname === "/platform" || pathname.startsWith("/platform/");

  if (isAuthRoute || isLanding) {
    return <>{children}</>;
  }

  if (isOnboarding || isPlatform) {
    return <TenantOnboardingGuard>{children}</TenantOnboardingGuard>;
  }

  return (
    <TenantOnboardingGuard>
      <TechnicianRouteGuard>
        <AppShell>{children}</AppShell>
      </TechnicianRouteGuard>
    </TenantOnboardingGuard>
  );
}

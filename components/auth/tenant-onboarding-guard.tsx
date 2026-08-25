"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthUserStore } from "@/store/auth-user-store";

type Props = {
  children: React.ReactNode;
};

const ONBOARDING_PATH = "/onboarding";

export function TenantOnboardingGuard({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthUserStore((s) => s.user);
  const hasActiveMembership = useAuthUserStore((s) => s.hasActiveMembership);
  const isFetched = useAuthUserStore((s) => s.isFetched);
  const fetchUser = useAuthUserStore((s) => s.fetchUser);

  const isOnboarding =
    pathname === ONBOARDING_PATH || pathname.startsWith(`${ONBOARDING_PATH}/`);
  const isPlatform =
    pathname === "/platform" || pathname.startsWith("/platform/");

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!isFetched || !user) return;

    if (user.role === "platform_admin") {
      if (isOnboarding) {
        router.replace("/dashboard");
      }
      return;
    }

    if (isPlatform && user.role !== "platform_admin") {
      router.replace("/dashboard");
      return;
    }

    if (!hasActiveMembership && !isOnboarding) {
      router.replace(ONBOARDING_PATH);
      return;
    }

    if (hasActiveMembership && isOnboarding) {
      router.replace("/dashboard");
    }
  }, [
    isFetched,
    user,
    hasActiveMembership,
    isOnboarding,
    isPlatform,
    pathname,
    router,
  ]);

  if (!isFetched || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Cargando...
      </div>
    );
  }

  if (user.role !== "platform_admin") {
    if (isPlatform) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          Redirigiendo...
        </div>
      );
    }
    if (!hasActiveMembership && !isOnboarding) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          Redirigiendo...
        </div>
      );
    }
    if (hasActiveMembership && isOnboarding) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          Redirigiendo...
        </div>
      );
    }
  } else if (isOnboarding) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Redirigiendo...
      </div>
    );
  }

  return <>{children}</>;
}

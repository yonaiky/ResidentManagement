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
  const hydrateFromCache = useAuthUserStore((s) => s.hydrateFromCache);
  const fetchUser = useAuthUserStore((s) => s.fetchUser);

  const isOnboarding =
    pathname === ONBOARDING_PATH || pathname.startsWith(`${ONBOARDING_PATH}/`);
  const isPlatform =
    pathname === "/platform" || pathname.startsWith("/platform/");

  useEffect(() => {
    hydrateFromCache();
    void (async () => {
      await fetchUser({ force: true });
      if (useAuthUserStore.getState().hasActiveMembership) {
        await fetch("/api/tenant/context/ensure", { method: "POST" }).catch(
          () => null
        );
      }
    })();
  }, [hydrateFromCache, fetchUser]);

  useEffect(() => {
    if (!isFetched || !user) return;

    if (user.role === "platform_admin") {
      if (isOnboarding) {
        router.replace("/dashboard");
      }
      return;
    }

    if (isPlatform) {
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
    router,
  ]);

  if (isFetched && user) {
    if (user.role === "platform_admin" && isOnboarding) {
      return null;
    }
    if (user.role !== "platform_admin") {
      if (isPlatform) return null;
      if (!hasActiveMembership && !isOnboarding) return null;
      if (hasActiveMembership && isOnboarding) return null;
    }
  }

  return <>{children}</>;
}

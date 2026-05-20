"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthUserStore } from "@/store/auth-user-store";
import {
  getDefaultHomeForRole,
  isTechnician,
  isTechnicianAllowedPath,
} from "@/lib/roles";

type Props = {
  children: React.ReactNode;
};

export function TechnicianRouteGuard({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthUserStore((s) => s.user);
  const isFetched = useAuthUserStore((s) => s.isFetched);
  const fetchUser = useAuthUserStore((s) => s.fetchUser);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!isFetched || !user) return;
    if (!isTechnician(user.role)) return;

    if (!isTechnicianAllowedPath(pathname)) {
      router.replace(getDefaultHomeForRole(user.role));
    }
  }, [isFetched, user, pathname, router]);

  if (isFetched && user && isTechnician(user.role)) {
    if (!isTechnicianAllowedPath(pathname)) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          Redirigiendo...
        </div>
      );
    }
  }

  return <>{children}</>;
}

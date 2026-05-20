"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthUserStore } from "@/store/auth-user-store";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft } from "lucide-react";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthUserStore((s) => s.user);
  const fetchUser = useAuthUserStore((s) => s.fetchUser);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (user && user.role !== "platform_admin") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-semibold">Plataforma SaaS</span>
            <nav className="ml-6 hidden gap-4 text-sm md:flex">
              <Link
                href="/platform"
                className={pathname === "/platform" ? "text-primary" : "text-muted-foreground"}
              >
                Resumen
              </Link>
              <Link
                href="/platform/tenants"
                className={
                  pathname.startsWith("/platform/tenants")
                    ? "text-primary"
                    : "text-muted-foreground"
                }
              >
                Tenants
              </Link>
            </nav>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              App
            </Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-6">{children}</main>
    </div>
  );
}

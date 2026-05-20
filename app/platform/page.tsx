"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type TenantRow = {
  id: string;
  name: string;
  status: string;
  plan: string;
  trialEndsAt: string | null;
};

export default function PlatformPage() {
  const { data } = useApiQuery<{ items: TenantRow[] }>(
    "platform-tenants",
    "/api/platform/tenants"
  );
  const items = data?.items ?? [];
  const trials = items.filter((t) => t.status === "TRIAL");
  const active = items.filter((t) => t.status === "ACTIVE");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Panel de plataforma</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{items.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{active.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">En prueba</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{trials.length}</p>
          </CardContent>
        </Card>
      </div>
      <Button asChild>
        <Link href="/platform/tenants">Gestionar tenants</Link>
      </Button>
    </div>
  );
}

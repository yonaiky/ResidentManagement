import { Suspense } from "react";
import { FiscalConfigForm } from "@/components/fiscal/fiscal-config-form";
import { Skeleton } from "@/components/ui/skeleton";
import { headers } from "next/headers";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getFiscalConfig() {
  const headersList = headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  
  const response = await fetch(`${protocol}://${host}/api/fiscal-config`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export default async function FiscalConfigPage() {
  const fiscalConfig = await getFiscalConfig();

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Configuración Fiscal</h1>
        <p className="text-muted-foreground">
          Configura la información fiscal de tu empresa para las facturas
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        }
      >
        <FiscalConfigForm initialData={fiscalConfig} />
      </Suspense>
    </div>
  );
} 
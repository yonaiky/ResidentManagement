"use client";

import Link from "next/link";
import { useApiQuery } from "@/hooks/use-api-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PropertyListItem } from "@/lib/tenant/types";
import { Building2, Plus } from "lucide-react";

export default function PropertiesPage() {
  const { data, isLoading } = useApiQuery<{ items: PropertyListItem[] }>(
    "properties-list",
    "/api/properties"
  );
  const items = data?.items ?? [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">Propiedades</h1>
          <p className="text-lg text-muted-foreground">
            Residenciales, torres, unidades y ocupación
          </p>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Nueva propiedad
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No hay residenciales. Completa el onboarding.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <Link key={p.id} href={`/properties/${p.id}`}>
              <Card className="card-hover h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="h-5 w-5 text-primary" />
                    {p.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-muted-foreground">Código: {p.code}</p>
                  <p>
                    {p.occupiedCount} / {p.unitCount} unidades ocupadas
                  </p>
                  <p className="text-2xl font-bold">{p.occupancyRate}%</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}



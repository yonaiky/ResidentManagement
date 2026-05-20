"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useApiQuery } from "@/hooks/use-api-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UnitMapGrid } from "@/components/properties/unit-map-grid";
import type { UnitMapItem, UnitDetail } from "@/lib/tenant/types";
import { ArrowLeft, Building2 } from "lucide-react";
import { getUnitStatusLabel } from "@/lib/tenant/constants";

type PropertyDetail = {
  id: string;
  name: string;
  code: string;
  address: string | null;
  propertyType: string;
};

export default function PropertyDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [selectedUnit, setSelectedUnit] = useState<UnitMapItem | null>(null);

  const { data: property, isLoading: loadingProperty } = useApiQuery<PropertyDetail>(
    `property-${id}`,
    `/api/properties/${id}`
  );

  const { data: mapData, isLoading: loadingMap } = useApiQuery<{ items: UnitMapItem[] }>(
    `property-map-${id}`,
    `/api/properties/${id}/map`
  );

  const unitQueryKey = selectedUnit ? `unit-${selectedUnit.id}` : "";
  const unitQueryUrl = selectedUnit ? `/api/units/${selectedUnit.id}` : "";
  const { data: unitDetail } = useApiQuery<UnitDetail>(
    unitQueryKey || "unit-skip",
    unitQueryUrl || "/api/health",
    { enabled: !!selectedUnit }
  );

  const mapItems = mapData?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/properties">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Building2 className="h-7 w-7 text-primary" />
            {loadingProperty ? "..." : property?.name ?? "Propiedad"}
          </h1>
          {property && (
            <p className="text-muted-foreground">
              {property.code} · {property.propertyType}
              {property.address ? ` · ${property.address}` : ""}
            </p>
          )}
        </div>
      </div>

      <Tabs defaultValue="mapa">
        <TabsList>
          <TabsTrigger value="mapa">Mapa</TabsTrigger>
          <TabsTrigger value="unidades">Unidades</TabsTrigger>
          <TabsTrigger value="detalle">Detalle unidad</TabsTrigger>
        </TabsList>

        <TabsContent value="mapa" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Mapa de unidades</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingMap ? (
                <p className="text-muted-foreground">Cargando mapa...</p>
              ) : (
                <UnitMapGrid items={mapItems} onSelect={setSelectedUnit} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unidades" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Listado ({mapItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {mapItems.map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      className="w-full rounded-lg border px-4 py-2 text-left hover:bg-muted"
                      onClick={() => setSelectedUnit(u)}
                    >
                      <span className="font-medium">{u.code}</span>
                      <span className="ml-2 text-sm text-muted-foreground">
                        {getUnitStatusLabel(u.computedStatus)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detalle" className="mt-4">
          {!selectedUnit ? (
            <p className="text-muted-foreground">
              Selecciona una unidad en el mapa o en el listado.
            </p>
          ) : unitDetail ? (
            <Card>
              <CardHeader>
                <CardTitle>Unidad {unitDetail.code}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Estado:{" "}
                  <strong>{getUnitStatusLabel(unitDetail.computedStatus)}</strong>
                </p>
                {unitDetail.owner && (
                  <p>
                    Propietario: {unitDetail.owner.name} (ID {unitDetail.owner.id})
                  </p>
                )}
                {unitDetail.tenantOccupant && (
                  <p>
                    Inquilino: {unitDetail.tenantOccupant.name} (ID{" "}
                    {unitDetail.tenantOccupant.id})
                  </p>
                )}
                <div>
                  <h3 className="font-semibold">Ocupaciones</h3>
                  <ul className="mt-2 space-y-1 text-sm">
                    {unitDetail.occupancies.map((o) => (
                      <li key={o.id}>
                        {o.role} — {o.resident.name} {o.resident.lastName} ({o.status})
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : (
            <p className="text-muted-foreground">Cargando detalle...</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

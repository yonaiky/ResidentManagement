"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useApiQuery } from "@/hooks/use-api-query";
import { invalidateCache } from "@/lib/client-fetch-cache";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UnitMapGrid } from "@/components/properties/unit-map-grid";
import { AddUnitModal } from "@/components/properties/add-unit-modal";
import type { UnitMapItem, UnitDetail } from "@/lib/tenant/types";
import { ArrowLeft, Building2, Plus } from "lucide-react";
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
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [tab, setTab] = useState("mapa");

  const { data: property, isLoading: loadingProperty } = useApiQuery<PropertyDetail>(
    `property-${id}`,
    `/api/properties/${id}`
  );

  const {
    data: mapData,
    isLoading: loadingMap,
    refresh: refreshMap,
  } = useApiQuery<{ items: UnitMapItem[] }>(
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

  function handleUnitCreated() {
    invalidateCache(`property-map-${id}`);
    void refreshMap();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
        <Button
          onClick={() => {
            setTab("unidades");
            setShowAddUnit(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar unidad
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="mapa">Mapa</TabsTrigger>
          <TabsTrigger value="unidades">Unidades</TabsTrigger>
          <TabsTrigger value="detalle">Detalle unidad</TabsTrigger>
        </TabsList>

        <TabsContent value="mapa" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Mapa de unidades</CardTitle>
              <CardDescription>
                Vista rápida de apartamentos / espacios del residencial
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingMap ? (
                <p className="text-muted-foreground">Cargando mapa...</p>
              ) : (
                <UnitMapGrid
                  items={mapItems}
                  onSelect={(u) => {
                    setSelectedUnit(u);
                    setTab("detalle");
                  }}
                  onAddClick={() => {
                    setTab("unidades");
                    setShowAddUnit(true);
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unidades" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle>Listado ({mapItems.length})</CardTitle>
                <CardDescription>
                  Unidades = apartamentos, villas, locales, etc. dentro de este
                  residencial.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setShowAddUnit(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar
              </Button>
            </CardHeader>
            <CardContent>
              {mapItems.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <p className="text-muted-foreground">
                    Todavía no hay unidades. Crea la primera (ej. A-101).
                  </p>
                  <Button onClick={() => setShowAddUnit(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar unidad
                  </Button>
                </div>
              ) : (
                <ul className="space-y-2">
                  {mapItems.map((u) => (
                    <li key={u.id}>
                      <button
                        type="button"
                        className="w-full rounded-lg border px-4 py-2 text-left hover:bg-muted"
                        onClick={() => {
                          setSelectedUnit(u);
                          setTab("detalle");
                        }}
                      >
                        <span className="font-medium">{u.code}</span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {getUnitStatusLabel(u.computedStatus)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
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

      <AddUnitModal
        propertyId={id}
        open={showAddUnit}
        onOpenChange={setShowAddUnit}
        onSuccess={handleUnitCreated}
      />
    </div>
  );
}

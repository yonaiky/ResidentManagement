"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { useApiQuery } from "@/hooks/use-api-query";
import { invalidateCache } from "@/lib/client-fetch-cache";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UnitMapGrid } from "@/components/properties/unit-map-grid";
import { AddUnitModal } from "@/components/properties/add-unit-modal";
import { EditUnitModal } from "@/components/properties/edit-unit-modal";
import { AssignOccupancyModal } from "@/components/properties/assign-occupancy-modal";
import { AddStructureModal } from "@/components/properties/add-structure-modal";
import type { UnitMapItem, UnitDetail } from "@/lib/tenant/types";
import {
  ArrowLeft,
  Building2,
  History,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
} from "lucide-react";
import {
  getOccupancyRoleLabel,
  getUnitStatusLabel,
  STRUCTURE_TYPES,
} from "@/lib/tenant/constants";
import { useToast } from "@/components/ui/use-toast";

type PropertyDetail = {
  id: string;
  name: string;
  code: string;
  address: string | null;
  propertyType: string;
};

type StructureItem = {
  id: string;
  name: string;
  structureType: string;
};

type HistoryData = {
  statusHistory: {
    id: string;
    fromStatus: string | null;
    toStatus: string;
    note: string | null;
    createdAt: string;
  }[];
  occupancyHistory: {
    id: string;
    residentId: number;
    role: string;
    action: string;
    note: string | null;
    createdAt: string;
  }[];
};

function structureTypeLabel(v: string) {
  return STRUCTURE_TYPES.find((s) => s.value === v)?.label ?? v;
}

export default function PropertyDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  const [selectedUnit, setSelectedUnit] = useState<UnitMapItem | null>(null);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [showEditUnit, setShowEditUnit] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showAddStructure, setShowAddStructure] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<UnitDetail | null>(null);
  const [tab, setTab] = useState("mapa");
  const [structures, setStructures] = useState<StructureItem[]>([]);
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [endingOccId, setEndingOccId] = useState<string | null>(null);

  const { data: property, isLoading: loadingProperty } =
    useApiQuery<PropertyDetail>(`property-${id}`, `/api/properties/${id}`);

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
  const {
    data: unitDetail,
    refresh: refreshUnit,
  } = useApiQuery<UnitDetail>(
    unitQueryKey || "unit-skip",
    unitQueryUrl || "/api/health",
    { enabled: !!selectedUnit }
  );

  const mapItems = mapData?.items ?? [];

  const loadStructures = useCallback(async () => {
    try {
      const res = await fetch(`/api/properties/${id}/structures`);
      const data = await res.json();
      setStructures(data.items ?? []);
    } catch {
      setStructures([]);
    }
  }, [id]);

  const loadHistory = useCallback(async (unitId: string) => {
    try {
      const res = await fetch(`/api/units/${unitId}/history`);
      const data = await res.json();
      if (res.ok) setHistory(data);
      else setHistory(null);
    } catch {
      setHistory(null);
    }
  }, []);

  useEffect(() => {
    void loadStructures();
  }, [loadStructures]);

  useEffect(() => {
    if (selectedUnit) {
      void loadHistory(selectedUnit.id);
    } else {
      setHistory(null);
    }
  }, [selectedUnit, loadHistory]);

  function refreshAll() {
    invalidateCache(`property-map-${id}`);
    void refreshMap();
    if (selectedUnit) {
      invalidateCache(`unit-${selectedUnit.id}`);
      void refreshUnit();
      void loadHistory(selectedUnit.id);
    }
  }

  async function confirmDeleteUnit() {
    if (!unitToDelete) return;
    try {
      const res = await fetch(`/api/units/${unitToDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo eliminar");
      }
      toast({ title: "Unidad eliminada" });
      if (selectedUnit?.id === unitToDelete.id) {
        setSelectedUnit(null);
        setTab("unidades");
      }
      setUnitToDelete(null);
      refreshAll();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    }
  }

  async function endOccupancy(occupancyId: string) {
    setEndingOccId(occupancyId);
    try {
      const res = await fetch(`/api/occupancies/${occupancyId}`, {
        method: "PATCH",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo finalizar");
      }
      toast({ title: "Ocupación finalizada" });
      refreshAll();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    } finally {
      setEndingOccId(null);
    }
  }

  function selectUnit(u: UnitMapItem) {
    setSelectedUnit(u);
    setTab("detalle");
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
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="mapa">Mapa</TabsTrigger>
          <TabsTrigger value="unidades">Unidades</TabsTrigger>
          <TabsTrigger value="estructuras">Estructuras</TabsTrigger>
          <TabsTrigger value="detalle">Detalle</TabsTrigger>
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
                  onSelect={selectUnit}
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
                  Unidades = apartamentos, villas, locales, etc.
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
                        onClick={() => selectUnit(u)}
                      >
                        <span className="font-medium">{u.code}</span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {getUnitStatusLabel(u.computedStatus)}
                        </span>
                        {u.structureName && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            · {u.structureName}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estructuras" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle>Torres / bloques</CardTitle>
                <CardDescription>
                  Organiza las unidades por torre, bloque o zona (opcional)
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setShowAddStructure(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar
              </Button>
            </CardHeader>
            <CardContent>
              {structures.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sin estructuras. Puedes crear “Torre A”, “Bloque 1”, etc.
                </p>
              ) : (
                <ul className="space-y-2">
                  {structures.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border px-4 py-2"
                    >
                      <span className="font-medium">{s.name}</span>
                      <Badge variant="secondary">
                        {structureTypeLabel(s.structureType)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detalle" className="mt-4 space-y-4">
          {!selectedUnit ? (
            <p className="text-muted-foreground">
              Selecciona una unidad en el mapa o en el listado.
            </p>
          ) : unitDetail ? (
            <>
              <Card>
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>Unidad {unitDetail.code}</CardTitle>
                    <CardDescription>
                      {getUnitStatusLabel(unitDetail.computedStatus)}
                      {unitDetail.structureName
                        ? ` · ${unitDetail.structureName}`
                        : ""}
                      {unitDetail.floor != null ? ` · Piso ${unitDetail.floor}` : ""}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowEditUnit(true)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAssign(true)}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Asignar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setUnitToDelete(unitDetail)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <p>
                      Habitaciones:{" "}
                      <strong>{unitDetail.bedrooms ?? "—"}</strong>
                    </p>
                    <p>
                      Área:{" "}
                      <strong>
                        {unitDetail.areaSqm != null
                          ? `${unitDetail.areaSqm} m²`
                          : "—"}
                      </strong>
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2 font-semibold">Ocupaciones activas</h3>
                    {unitDetail.occupancies.filter((o) => o.status === "active")
                      .length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Nadie asignado. Usa &quot;Asignar&quot; para vincular un
                        residente.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {unitDetail.occupancies
                          .filter((o) => o.status === "active")
                          .map((o) => (
                            <li
                              key={o.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                            >
                              <span>
                                <Badge variant="outline" className="mr-2">
                                  {getOccupancyRoleLabel(o.role)}
                                </Badge>
                                {o.resident.name} {o.resident.lastName} (
                                {o.resident.cedula})
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={endingOccId === o.id}
                                onClick={() => void endOccupancy(o.id)}
                              >
                                Finalizar
                              </Button>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <History className="h-4 w-4" />
                    Historial
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Estados</h4>
                    {!history?.statusHistory.length ? (
                      <p className="text-xs text-muted-foreground">Sin cambios</p>
                    ) : (
                      <ul className="space-y-2 text-xs">
                        {history.statusHistory.map((h) => (
                          <li key={h.id} className="rounded border px-2 py-1.5">
                            {h.fromStatus
                              ? `${getUnitStatusLabel(h.fromStatus)} → `
                              : ""}
                            {getUnitStatusLabel(h.toStatus)}
                            <span className="ml-2 text-muted-foreground">
                              {format(new Date(h.createdAt), "dd/MM/yyyy HH:mm")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Ocupaciones</h4>
                    {!history?.occupancyHistory.length ? (
                      <p className="text-xs text-muted-foreground">Sin eventos</p>
                    ) : (
                      <ul className="space-y-2 text-xs">
                        {history.occupancyHistory.map((h) => (
                          <li key={h.id} className="rounded border px-2 py-1.5">
                            {h.action === "assigned" ? "Asignado" : "Finalizado"}{" "}
                            · {getOccupancyRoleLabel(h.role)} · residente #
                            {h.residentId}
                            <span className="ml-2 text-muted-foreground">
                              {format(new Date(h.createdAt), "dd/MM/yyyy HH:mm")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <p className="text-muted-foreground">Cargando detalle...</p>
          )}
        </TabsContent>
      </Tabs>

      <AddUnitModal
        propertyId={id}
        structures={structures}
        open={showAddUnit}
        onOpenChange={setShowAddUnit}
        onSuccess={refreshAll}
      />
      <EditUnitModal
        unit={unitDetail}
        structures={structures}
        open={showEditUnit}
        onOpenChange={setShowEditUnit}
        onSuccess={refreshAll}
      />
      {selectedUnit && (
        <AssignOccupancyModal
          unitId={selectedUnit.id}
          unitCode={selectedUnit.code}
          open={showAssign}
          onOpenChange={setShowAssign}
          onSuccess={refreshAll}
        />
      )}
      <AddStructureModal
        propertyId={id}
        open={showAddStructure}
        onOpenChange={setShowAddStructure}
        onSuccess={() => void loadStructures()}
      />

      <AlertDialog
        open={!!unitToDelete}
        onOpenChange={(open) => !open && setUnitToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar unidad?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la unidad {unitToDelete?.code} y sus ocupaciones /
              historial asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDeleteUnit()}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

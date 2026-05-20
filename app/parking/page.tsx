"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ParkingSummaryCards } from "@/components/parking/parking-summary-cards";
import { AvailabilityGrid } from "@/components/parking/availability-grid";
import { SpotsTable } from "@/components/parking/spots-table";
import { VehiclesTable } from "@/components/parking/vehicles-table";
import { VisitsTable } from "@/components/parking/visits-table";
import { FinesTable } from "@/components/parking/fines-table";
import type { ParkingOverview } from "@/lib/parking/types";
import { Car, LayoutGrid, MapPin, Users, AlertTriangle } from "lucide-react";

export default function ParkingPage() {
  const { data: overview, isLoading } = useApiQuery<ParkingOverview>(
    "parking-overview",
    "/api/parking/overview"
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-2">
        <h1 className="page-title">Parqueos y Vehículos</h1>
        <p className="text-lg text-muted-foreground">
          Espacios, placas, visitas, multas y disponibilidad
        </p>
      </div>

      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="summary" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="spots" className="gap-2">
            <MapPin className="h-4 w-4" />
            Espacios
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="gap-2">
            <Car className="h-4 w-4" />
            Vehículos
          </TabsTrigger>
          <TabsTrigger value="visits" className="gap-2">
            <Users className="h-4 w-4" />
            Visitas
          </TabsTrigger>
          <TabsTrigger value="fines" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Multas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          {isLoading || !overview ? (
            <p className="text-muted-foreground">Cargando resumen...</p>
          ) : (
            <ParkingSummaryCards overview={overview} />
          )}
          <Card className="card-hover">
            <CardHeader className="card-accent-header">
              <CardTitle>Disponibilidad de espacios</CardTitle>
              <CardDescription>
                Vista rápida del estado de cada espacio en el catálogo
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <AvailabilityGrid />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spots">
          <Card className="card-hover">
            <CardHeader className="card-accent-header">
              <CardTitle>Catálogo de espacios</CardTitle>
              <CardDescription>
                Inventario numerado de parqueos del residencial
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <SpotsTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehicles">
          <Card className="card-hover">
            <CardHeader className="card-accent-header">
              <CardTitle>Vehículos y asignaciones</CardTitle>
              <CardDescription>
                Placas registradas y parqueos asignados por residente
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <VehiclesTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visits">
          <Card className="card-hover">
            <CardHeader className="card-accent-header">
              <CardTitle>Visitas vehiculares</CardTitle>
              <CardDescription>
                Registro temporal de vehículos visitantes
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <VisitsTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fines">
          <Card className="card-hover">
            <CardHeader className="card-accent-header">
              <CardTitle>Multas de parqueo</CardTitle>
              <CardDescription>
                Infracciones y seguimiento de pago (registro independiente)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <FinesTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

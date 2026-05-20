"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ParkingDashboardStats } from "@/lib/dashboard/types";
import { AlertTriangle, ArrowRight, Car, MapPin } from "lucide-react";

type Props = {
  stats: ParkingDashboardStats;
};

export function ParkingSummaryWidget({ stats }: Props) {
  return (
    <Card className="border-emerald-200/50 dark:border-emerald-900/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Car className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          Parqueos
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/parking">
            Ver módulo
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Espacios totales</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.available}
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              Disponibles
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.occupied}
            </p>
            <p className="text-xs text-muted-foreground">Ocupados</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.pendingFines}
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <AlertTriangle className="h-3 w-3" />
              Multas pendientes
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

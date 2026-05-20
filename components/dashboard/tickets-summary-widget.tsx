"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TicketDashboardStats } from "@/lib/dashboard/types";
import { AlertTriangle, ArrowRight, UserX, Wrench } from "lucide-react";

type Props = {
  stats: TicketDashboardStats;
};

export function TicketsSummaryWidget({ stats }: Props) {
  return (
    <Card className="border-orange-200/50 dark:border-orange-900/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Wrench className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          Mantenimiento
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/tickets">
            Ver todos
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-2xl font-bold">{stats.openCount}</p>
            <p className="text-xs text-muted-foreground">Abiertos</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.inProgressCount}</p>
            <p className="text-xs text-muted-foreground">En progreso</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.unassignedCount}
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <UserX className="h-3 w-3" />
              Sin asignar
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.slaBreachedCount}
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <AlertTriangle className="h-3 w-3" />
              SLA vencido
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

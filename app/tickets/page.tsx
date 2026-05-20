"use client";

import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateTicketModal } from "@/components/tickets/create-ticket-modal";
import { TicketsFiltersBar } from "@/components/tickets/tickets-filters";
import { TicketsTable } from "@/components/tickets/tickets-table";
import { TicketsBoard } from "@/components/tickets/tickets-board";
import { TicketsViewToggle } from "@/components/tickets/tickets-view-toggle";
import { useTicketsFilters } from "@/hooks/use-tickets-filters";
import { useTicketsViewMode } from "@/hooks/use-tickets-view-mode";
import { useApiQuery } from "@/hooks/use-api-query";
import { invalidateCache } from "@/lib/client-fetch-cache";
import { useAuthUserStore } from "@/store/auth-user-store";
import type { TicketsListResponse } from "@/lib/tickets/types";
import { isTechnician } from "@/lib/roles";
import { Plus, Wrench } from "lucide-react";

function TicketsPageContent() {
  const [showCreate, setShowCreate] = useState(false);
  const { viewMode, setViewMode, hydrated } = useTicketsViewMode();
  const fetchUser = useAuthUserStore((s) => s.fetchUser);
  const authUser = useAuthUserStore((s) => s.user);
  const isTech = isTechnician(authUser?.role);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  const {
    activeDraft,
    apiUrl,
    updateDraft,
    applyFilters,
    resetFilters,
    setPage,
    hasActiveFilters,
  } = useTicketsFilters(viewMode);

  const cacheKey = `tickets-${viewMode}-${apiUrl}`;
  const { data, isLoading, refresh } = useApiQuery<TicketsListResponse>(
    cacheKey,
    apiUrl
  );

  const handleSuccess = () => {
    invalidateCache(cacheKey);
    void refresh();
  };

  const handleBoardMoved = () => {
    invalidateCache(cacheKey);
    void refresh();
  };

  if (!hydrated) {
    return (
      <div className="py-12 text-center text-muted-foreground">Cargando...</div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="page-title">
            {isTech ? "Mis asignaciones" : "Mantenimiento"}
          </h1>
          <p className="text-lg text-muted-foreground">
            {isTech
              ? "Tickets asignados a ti"
              : "Tickets de incidencias, asignación y seguimiento SLA"}
          </p>
        </div>
        {!isTech && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo ticket
          </Button>
        )}
      </div>

      <TicketsFiltersBar
        draft={activeDraft}
        onUpdate={updateDraft}
        onApply={applyFilters}
        onReset={resetFilters}
        hasActiveFilters={hasActiveFilters}
        hideStatusFilter={viewMode === "board"}
      />

      <Card className="card-hover">
        <CardHeader className="card-accent-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className="icon-badge">
                <Wrench className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              Tickets
            </CardTitle>
            <CardDescription>
              {data?.total != null
                ? `${data.total} ticket${data.total !== 1 ? "s" : ""} en total`
                : "Listado de mantenimiento"}
              {viewMode === "board" && data && data.total > 100
                ? " (mostrando hasta 100 en tablero)"
                : ""}
            </CardDescription>
          </div>
          <TicketsViewToggle value={viewMode} onChange={setViewMode} />
        </CardHeader>
        <CardContent className="min-w-0 p-4 sm:p-6">
          {viewMode === "table" ? (
            <TicketsTable
              data={data ?? undefined}
              isLoading={isLoading}
              onPageChange={setPage}
            />
          ) : (
            <TicketsBoard
              items={data?.items ?? []}
              isLoading={isLoading}
              onTicketMoved={handleBoardMoved}
            />
          )}
        </CardContent>
      </Card>

      <CreateTicketModal
        open={showCreate}
        onOpenChange={setShowCreate}
        onSuccess={handleSuccess}
      />
    </>
  );
}

export default function TicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-muted-foreground">Cargando...</div>
      }
    >
      <TicketsPageContent />
    </Suspense>
  );
}

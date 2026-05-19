"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TokensTable } from "@/components/tokens/tokens-table";
import { Plus, Key, CreditCard } from "lucide-react";
import { AddTokenModal } from "@/components/tokens/add-token-modal";

export default function TokensPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="page-title">
              Gestión de Tokens
            </h1>
            <p className="text-lg text-muted-foreground">
              Administra todos los tokens de acceso y sus residentes asociados
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <CreditCard className="mr-2 h-4 w-4" />
                Ver Dashboard
              </Link>
            </Button>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Token
            </Button>
          </div>
        </div>

        <Card className="card-hover">
          <CardHeader className="card-accent-header">
            <CardTitle className="flex items-center gap-2">
              <div className="icon-badge-violet">
                <Key className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              Todos los Tokens
            </CardTitle>
            <CardDescription>
              Lista de todos los tokens con su estado e información de pago
            </CardDescription>
          </CardHeader>
          <CardContent className="min-w-0 p-4 sm:p-6">
            <TokensTable key={refreshKey} />
          </CardContent>
        </Card>
      </div>

      <AddTokenModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResidentsTable } from "@/components/residents/residents-table";
import { Plus, Users } from "lucide-react";
import { AddResidentModal } from "@/components/residents/add-resident-modal";

export default function ResidentsPage() {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="page-title">
            Gestión de Residentes
          </h1>
          <p className="text-lg text-muted-foreground">
            Administra la información y pagos de todos los residentes
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Residente
        </Button>
      </div>

      <Card className="card-hover">
        <CardHeader className="card-accent-header">
          <CardTitle className="flex items-center gap-2">
            <div className="icon-badge">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            Todos los Residentes
          </CardTitle>
          <CardDescription>
            Lista completa de residentes registrados en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="min-w-0 p-4 sm:p-6">
          <ResidentsTable />
        </CardContent>
      </Card>

      <AddResidentModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={() => setShowAddModal(false)}
      />
    </>
  );
}

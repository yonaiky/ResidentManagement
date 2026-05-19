"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PaymentsTable } from "@/components/payments/payments-table";
import { Plus, CreditCard, DollarSign } from "lucide-react";

export default function PaymentsPage() {
  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="page-title">
            Gestión de Pagos
          </h1>
          <p className="text-lg text-muted-foreground">
            Administra todos los registros de pagos y transacciones
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <DollarSign className="mr-2 h-4 w-4" />
              Ver Dashboard
            </Link>
          </Button>
          <Button asChild>
            <Link href="/residents">
              <CreditCard className="mr-2 h-4 w-4" />
              Registrar Pago
            </Link>
          </Button>
        </div>
      </div>

      <Card className="card-hover">
        <CardHeader className="card-accent-header">
          <CardTitle className="flex items-center gap-2">
            <div className="icon-badge-success">
              <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            Todos los Pagos
          </CardTitle>
          <CardDescription>
            Lista completa de todas las transacciones de pago en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="min-w-0 p-4 sm:p-6">
          <PaymentsTable />
        </CardContent>
      </Card>
    </>
  );
}

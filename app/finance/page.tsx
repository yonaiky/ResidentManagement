"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus } from "lucide-react";

type FeeItem = {
  id: string;
  name: string;
  concept: string;
  amount: number;
  dueDate: string;
  status: string;
  chargeCount: number;
};

type DashStats = {
  incomeMonth: number;
  expensesMonth: number;
  operatingBalance: number;
  accountsReceivable: number;
  overdueTotal: number;
  unitsCurrent: number;
  unitsPending: number;
  unitsOverdue: number;
};

type Receivable = {
  unitId: string;
  unitCode: string;
  propertyName: string;
  responsibleName: string | null;
  totalDebt: number;
  overdue: number;
  maxDaysOverdue: number;
  arrearsBucket: string | null;
};

function moneyFmt(n: number) {
  return `RD$${n.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`;
}

export default function FinancePage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashStats | null>(null);
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("3500");
  const [dueDate, setDueDate] = useState("");

  const load = useCallback(async () => {
    try {
      const [d, f, r] = await Promise.all([
        fetch("/api/finance/dashboard").then((x) => x.json()),
        fetch("/api/finance/fees").then((x) => x.json()),
        fetch("/api/finance/receivables").then((x) => x.json()),
      ]);
      setStats(d);
      setFees(f.items ?? []);
      setReceivables(r.items ?? []);
    } catch {
      toast({
        title: "Error",
        description: "No se pudo cargar finanzas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createFee(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/finance/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          concept: concept || name,
          amount: parseFloat(amount),
          dueDate,
          generateCharges: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      toast({
        title: "Cuota creada",
        description: `${data.charges?.created ?? 0} cargos generados`,
      });
      setShowForm(false);
      setName("");
      setConcept("");
      await load();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Cargando finanzas...
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Finanzas</h1>
          <p className="text-muted-foreground">
            Cuotas, cargos, cartera y métricas de la organización activa.
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva cuota
        </Button>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Ingresos del mes</CardDescription>
              <CardTitle className="text-2xl">
                {moneyFmt(stats.incomeMonth)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Cuentas por cobrar</CardDescription>
              <CardTitle className="text-2xl">
                {moneyFmt(stats.accountsReceivable)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Morosidad</CardDescription>
              <CardTitle className="text-2xl text-destructive">
                {moneyFmt(stats.overdueTotal)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Gastos del mes</CardDescription>
              <CardTitle className="text-2xl">
                {moneyFmt(stats.expensesMonth)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Crear cuota y generar cargos</CardTitle>
            <CardDescription>
              Se aplicará a unidades activas sin duplicar cargos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createFee} className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mantenimiento Septiembre 2026"
                  required
                />
              </div>
              <div>
                <Label>Concepto</Label>
                <Input
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="Cuota ordinaria"
                />
              </div>
              <div>
                <Label>Monto</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Vencimiento</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Crear y generar cargos"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cuotas recientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fees.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin cuotas aún.</p>
            ) : (
              fees.slice(0, 8).map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between border-b pb-2 text-sm last:border-0"
                >
                  <div>
                    <p className="font-medium">{f.name}</p>
                    <p className="text-muted-foreground">
                      {f.chargeCount} cargos · vence{" "}
                      {new Date(f.dueDate).toLocaleDateString("es-DO")}
                    </p>
                  </div>
                  <span className="font-medium">{moneyFmt(f.amount)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cuentas por cobrar</CardTitle>
            <CardDescription>Unidades con saldo pendiente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {receivables.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin deudas abiertas.</p>
            ) : (
              receivables.slice(0, 10).map((r) => (
                <div
                  key={r.unitId}
                  className="flex items-center justify-between border-b pb-2 text-sm last:border-0"
                >
                  <div>
                    <Link
                      href={`/finance/units/${r.unitId}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {r.unitCode}
                    </Link>
                    <p className="text-muted-foreground">
                      {r.responsibleName ?? "Sin responsable"} ·{" "}
                      {r.arrearsBucket
                        ? `Mora ${r.arrearsBucket} días`
                        : "Al día / no vencido"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{moneyFmt(r.totalDebt)}</p>
                    {r.overdue > 0 && (
                      <p className="text-xs text-destructive">
                        Vencido {moneyFmt(r.overdue)}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

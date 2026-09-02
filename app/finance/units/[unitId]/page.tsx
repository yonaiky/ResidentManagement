"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";

type StatementLine = {
  date: string;
  concept: string;
  type: string;
  charge: number;
  payment: number;
  credit: number;
  balance: number;
  entityId?: string;
};

type ChargeItem = {
  id: string;
  concept: string;
  amount: number;
  outstandingAmount: number;
  status: string;
  dueDate: string;
};

function moneyFmt(n: number) {
  return `RD$${n.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`;
}

export default function UnitFinancePage() {
  const params = useParams();
  const unitId = params.unitId as string;
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [unitCode, setUnitCode] = useState("");
  const [responsible, setResponsible] = useState<string | null>(null);
  const [balance, setBalance] = useState({
    balance: 0,
    totalOutstanding: 0,
    totalOverdue: 0,
    creditAvailable: 0,
  });
  const [lines, setLines] = useState<StatementLine[]>([]);
  const [charges, setCharges] = useState<ChargeItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("transfer");
  const [reference, setReference] = useState("");

  const load = useCallback(async () => {
    try {
      const [st, ch] = await Promise.all([
        fetch(`/api/finance/units/${unitId}/statement`).then((r) => r.json()),
        fetch(`/api/finance/charges?unitId=${unitId}`).then((r) => r.json()),
      ]);
      if (st.error) throw new Error(st.error);
      setUnitCode(st.unit?.code ?? unitId);
      setResponsible(st.responsible?.name ?? null);
      setBalance(st.balance);
      setLines(st.lines ?? []);
      const open = (ch.items ?? []).filter(
        (c: ChargeItem) => c.outstandingAmount > 0
      );
      setCharges(open);
      setSelected(open.map((c: ChargeItem) => c.id));
      const sum = open.reduce(
        (s: number, c: ChargeItem) => s + c.outstandingAmount,
        0
      );
      setAmount(sum > 0 ? String(sum) : "");
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, unitId]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleCharge(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function registerPayment(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast({ title: "Monto inválido", variant: "destructive" });
      return;
    }
    setPaying(true);
    try {
      const res = await fetch("/api/finance/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitId,
          amount: amt,
          paymentMethod: method,
          reference,
          chargeIds: selected.length ? selected : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      toast({
        title: "Pago registrado",
        description: `Recibo ${data.receipt?.number ?? ""}`,
      });
      setReference("");
      await load();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Cargando estado de cuenta...
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link href="/finance">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Finanzas
          </Link>
        </Button>
        <h1 className="page-title">Unidad {unitCode}</h1>
        <p className="text-muted-foreground">
          Responsable: {responsible ?? "—"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Balance actual</CardDescription>
            <CardTitle className="text-2xl">
              {moneyFmt(balance.balance)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vencido</CardDescription>
            <CardTitle className="text-2xl text-destructive">
              {moneyFmt(balance.totalOverdue)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Crédito a favor</CardDescription>
            <CardTitle className="text-2xl">
              {moneyFmt(balance.creditAvailable)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Estado de cuenta</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-2">Fecha</th>
                  <th className="py-2 pr-2">Concepto</th>
                  <th className="py-2 pr-2 text-right">Cargo</th>
                  <th className="py-2 pr-2 text-right">Pago</th>
                  <th className="py-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {lines.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-muted-foreground">
                      Sin movimientos
                    </td>
                  </tr>
                ) : (
                  lines.map((l, i) => (
                    <tr key={`${l.entityId}-${i}`} className="border-b last:border-0">
                      <td className="py-2 pr-2 whitespace-nowrap">
                        {new Date(l.date).toLocaleDateString("es-DO")}
                      </td>
                      <td className="py-2 pr-2">{l.concept}</td>
                      <td className="py-2 pr-2 text-right">
                        {l.charge ? moneyFmt(l.charge) : "—"}
                      </td>
                      <td className="py-2 pr-2 text-right">
                        {l.payment ? moneyFmt(l.payment) : "—"}
                      </td>
                      <td className="py-2 text-right font-medium">
                        {moneyFmt(l.balance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Registrar pago</CardTitle>
            <CardDescription>
              Balance: {moneyFmt(balance.totalOutstanding)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={registerPayment} className="space-y-4">
              <div className="space-y-2">
                {charges.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-start gap-2 rounded border p-2 text-sm"
                  >
                    <Checkbox
                      checked={selected.includes(c.id)}
                      onCheckedChange={() => toggleCharge(c.id)}
                    />
                    <span className="flex-1">
                      <span className="font-medium">{c.concept}</span>
                      <span className="block text-muted-foreground">
                        Pendiente {moneyFmt(c.outstandingAmount)} · {c.status}
                      </span>
                    </span>
                  </label>
                ))}
                {charges.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Sin cargos pendientes. Un pago creará crédito a favor.
                  </p>
                )}
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
                <Label>Método</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                    <SelectItem value="card">Tarjeta</SelectItem>
                    <SelectItem value="gateway">Pasarela</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Referencia</Label>
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="12345"
                />
              </div>
              <Button type="submit" className="w-full" disabled={paying}>
                {paying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  "Registrar pago"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

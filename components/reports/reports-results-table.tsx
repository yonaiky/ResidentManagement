"use client";

import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  ArrearsReportRow,
  PaymentReportRow,
  ReportRow,
  ReportType,
  ResidentReportRow,
  TokenReportRow,
} from "@/lib/reports/types";

type ReportsResultsTableProps = {
  reportType: ReportType;
  rows: ReportRow[];
  loading?: boolean;
};

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  if (normalized === "completed" || normalized === "paid") {
    return <Badge className="status-indicator status-paid">Completado</Badge>;
  }
  if (normalized === "overdue") {
    return <Badge className="status-indicator status-overdue">Vencido</Badge>;
  }
  if (normalized === "active") {
    return <Badge variant="secondary">Activo</Badge>;
  }
  if (normalized === "inactive") {
    return <Badge variant="outline">Inactivo</Badge>;
  }
  return <Badge className="status-indicator status-pending">Pendiente</Badge>;
}

function formatMoney(amount: number) {
  return amount.toLocaleString("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 0,
  });
}

export function ReportsResultsTable({
  reportType,
  rows,
  loading,
}: ReportsResultsTableProps) {
  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
        Cargando resultados...
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
        <p className="font-medium">Sin resultados</p>
        <p className="text-sm">Ajusta los filtros e intenta de nuevo.</p>
      </div>
    );
  }

  if (reportType === "payments") {
    return (
      <PaymentsTable rows={rows as PaymentReportRow[]} />
    );
  }
  if (reportType === "residents") {
    return <ResidentsTable rows={rows as ResidentReportRow[]} />;
  }
  if (reportType === "tokens") {
    return <TokensTable rows={rows as TokenReportRow[]} />;
  }
  return <ArrearsTable rows={rows as ArrearsReportRow[]} />;
}

function PaymentsTable({ rows }: { rows: PaymentReportRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Residente</TableHead>
            <TableHead>Registro</TableHead>
            <TableHead>Período</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha pago</TableHead>
            <TableHead>Vencimiento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <Link
                  href={`/residents/${row.residentId}`}
                  className="font-medium hover:text-primary"
                >
                  {row.residentName}
                </Link>
                <p className="text-xs text-muted-foreground">{row.cedula}</p>
              </TableCell>
              <TableCell>{row.noRegistro || "—"}</TableCell>
              <TableCell className="capitalize">
                {row.monthName} {row.year}
              </TableCell>
              <TableCell className="font-medium">{formatMoney(row.amount)}</TableCell>
              <TableCell>
                <StatusBadge status={row.status} />
              </TableCell>
              <TableCell>
                {row.paymentDate
                  ? format(new Date(row.paymentDate), "dd MMM yyyy", { locale: es })
                  : "—"}
              </TableCell>
              <TableCell>
                {format(new Date(row.dueDate), "dd MMM yyyy", { locale: es })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ResidentsTable({ rows }: { rows: ResidentReportRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Residente</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Cobrado</TableHead>
            <TableHead>Pendiente</TableHead>
            <TableHead>Tokens</TableHead>
            <TableHead>Próximo pago</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <Link
                  href={`/residents/${row.id}`}
                  className="font-medium hover:text-primary"
                >
                  {row.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {row.noRegistro || row.cedula}
                </p>
              </TableCell>
              <TableCell className="text-sm">{row.phone}</TableCell>
              <TableCell>
                <StatusBadge status={row.paymentStatus} />
              </TableCell>
              <TableCell>{formatMoney(row.totalPaid)}</TableCell>
              <TableCell>{formatMoney(row.pendingAmount)}</TableCell>
              <TableCell>{row.activeTokens}</TableCell>
              <TableCell>
                {row.nextPaymentDate
                  ? format(new Date(row.nextPaymentDate), "dd MMM yyyy", { locale: es })
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TokensTable({ rows }: { rows: TokenReportRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Token</TableHead>
            <TableHead>Residente</TableHead>
            <TableHead>Registro</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Alta</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell>
                <Link
                  href={`/residents/${row.residentId}`}
                  className="hover:text-primary"
                >
                  {row.residentName}
                </Link>
              </TableCell>
              <TableCell>{row.noRegistro || "—"}</TableCell>
              <TableCell>
                <StatusBadge status={row.status} />
              </TableCell>
              <TableCell>
                {format(new Date(row.createdAt), "dd MMM yyyy", { locale: es })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ArrearsTable({ rows }: { rows: ArrearsReportRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Residente</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Monto pendiente</TableHead>
            <TableHead>Vencimiento</TableHead>
            <TableHead>Cuotas vencidas</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <Link
                  href={`/residents/${row.id}`}
                  className="font-medium hover:text-primary"
                >
                  {row.residentName}
                </Link>
                <p className="text-xs text-muted-foreground">{row.cedula}</p>
              </TableCell>
              <TableCell className="text-sm">{row.phone}</TableCell>
              <TableCell className="font-semibold text-amber-600 dark:text-amber-400">
                {formatMoney(row.pendingAmount)}
              </TableCell>
              <TableCell>
                {row.oldestDueDate
                  ? format(new Date(row.oldestDueDate), "dd MMM yyyy", { locale: es })
                  : "—"}
              </TableCell>
              <TableCell>{row.overdueCount}</TableCell>
              <TableCell>
                <StatusBadge status={row.paymentStatus} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

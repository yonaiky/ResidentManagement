"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  Clock,
  Search,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

type PendingPayment = {
  id: number;
  residentId: number;
  residentName: string;
  amount: number;
  dueDate: string;
  status: string;
  noRegistro: string;
  cedula: string;
};

export function PendingPayments() {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      const res = await fetch('/api/payments/pending');
      if (!res.ok) throw new Error("Error al cargar los pagos pendientes");
      const data = await res.json();
      setPayments(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los pagos pendientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(
    (payment) =>
      payment.residentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.noRegistro.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.cedula.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div>Cargando pagos pendientes...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por residente, cédula o número de registro..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Residente</TableHead>
              <TableHead>Cédula</TableHead>
              <TableHead>No. Registro</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Fecha de Vencimiento</TableHead>
              <TableHead>Días de Atraso</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.map((payment) => {
              const daysOverdue = differenceInDays(
                new Date(),
                new Date(payment.dueDate)
              );

              return (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <Link 
                        href={`/residents/${payment.residentId}`}
                        className="hover:underline"
                      >
                        {payment.residentName}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>{payment.cedula}</TableCell>
                  <TableCell>{payment.noRegistro}</TableCell>
                  <TableCell className="font-medium">${payment.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    {format(new Date(payment.dueDate), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    {daysOverdue > 0 ? (
                      <span className="text-red-500">{daysOverdue} días</span>
                    ) : (
                      <span className="text-amber-500">
                        {Math.abs(daysOverdue)} días restantes
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {daysOverdue > 0 ? (
                      <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Vencido
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                        <Clock className="mr-1 h-3 w-3" />
                        Pendiente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/payments/${payment.id}`}>
                        Ver detalles
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredPayments.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  No se encontraron pagos pendientes
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
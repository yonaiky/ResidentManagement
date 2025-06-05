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
  CheckCircle,
  Search,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

type Payment = {
  id: number;
  amount: number;
  status: string;
  paymentDate: string;
  residentId: number;
  residentName: string;
  noRegistro: string;
  cedula: string;
  monthName: string;
  year: number;
};

export function RecentPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchRecentPayments();
  }, []);

  const fetchRecentPayments = async () => {
    try {
      const res = await fetch('/api/payments/recent');
      if (!res.ok) throw new Error("Error al cargar los pagos recientes");
      const data = await res.json();
      setPayments(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los pagos recientes",
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
    return <div>Cargando pagos recientes...</div>;
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
              <TableHead>Período</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha de Pago</TableHead>
              <TableHead>Residente</TableHead>
              <TableHead>Cédula</TableHead>
              <TableHead>No. Registro</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{`${payment.monthName} ${payment.year}`}</TableCell>
                <TableCell className="font-medium">${payment.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Completado
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(payment.paymentDate), "dd/MM/yyyy")}
                </TableCell>
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
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/payments/${payment.id}`}>
                      Ver detalles
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredPayments.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  No se encontraron pagos recientes
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
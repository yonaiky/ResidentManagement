"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { History } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface Payment {
  id: number;
  amount: number;
  status: string;
  paymentDate: string | null;
  dueDate: string | null;
  month: number;
  year: number;
  createdAt: string;
}

interface PaymentHistoryDialogProps {
  residentId: number;
  residentName: string;
}

export function PaymentHistoryDialog({ residentId, residentName }: PaymentHistoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchPayments();
    }
  }, [open, residentId]);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/residents/${residentId}/payments`);
      if (!response.ok) {
        throw new Error("Error al cargar los pagos");
      }
      const data = await response.json();
      setPayments(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los pagos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "text-green-600";
      case "pending":
        return "text-yellow-600";
      case "overdue":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Pagado";
      case "pending":
        return "Pendiente";
      case "overdue":
        return "Vencido";
      default:
        return status;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return format(new Date(date), "dd/MM/yyyy", { locale: es });
  };

  const formatMonth = (month: number, year: number) => {
    const date = new Date(year, month - 1);
    return format(date, "MMMM yyyy", { locale: es });
  };

  const getDaysRemaining = (dueDate: string | null) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const days = differenceInDays(due, today);
    return days;
  };

  const getDaysRemainingBadge = (status: string, dueDate: string | null) => {
    if (status !== "pending" || !dueDate) return null;
    
    const days = getDaysRemaining(dueDate);
    if (days === null) return null;

    if (days < 0) {
      return (
        <Badge variant="destructive" className="ml-2">
          Vencido
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="ml-2">
        {days} {days === 1 ? "día" : "días"} restantes
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="mr-2 h-4 w-4" />
          Historial de Pagos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Historial de Pagos - {residentName}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {isLoading ? (
            <div className="text-center py-4">Cargando pagos...</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-4">No hay pagos registrados</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha de Pago</TableHead>
                  <TableHead>Fecha de Vencimiento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatMonth(payment.month, payment.year)}</TableCell>
                    <TableCell>RD$ {payment.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className={getStatusColor(payment.status)}>
                          {getStatusText(payment.status)}
                        </span>
                        {getDaysRemainingBadge(payment.status, payment.dueDate)}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell>{formatDate(payment.dueDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  FileDown,
  MoreHorizontal,
  Printer,
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
  paymentDate: string | null;
  dueDate: string | null;
  residentId: number;
  residentName: string;
  cedula: string;
  noRegistro: string;
  monthName: string;
  year: number;
};

export function PaymentsTable() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/payments');
      if (!res.ok) throw new Error("Error al cargar los pagos");
      const data = await res.json();
      setPayments(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los pagos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(
    (payment) =>
      (payment.residentName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (payment.status?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (payment.noRegistro?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search payments..."
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
              <TableHead>Fecha de Vencimiento</TableHead>
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
                  {payment.status === "completed" ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Completed
                    </Badge>
                  ) : payment.status === "pending" ? (
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                      <Clock className="mr-1 h-3 w-3" />
                      Pending
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      Overdue
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {payment.paymentDate
                    ? format(new Date(payment.paymentDate), "dd/MM/yyyy")
                    : "No pagado"}
                </TableCell>
                <TableCell>
                  {payment.dueDate
                    ? format(new Date(payment.dueDate), "dd/MM/yyyy")
                    : "N/A"}
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/payments/${payment.id}`}>
                          <Eye className="mr-2 h-4 w-4" /> View details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Printer className="mr-2 h-4 w-4" /> Print receipt
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <FileDown className="mr-2 h-4 w-4" /> Export
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
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
import { es } from 'date-fns/locale';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

  const generateReceipt = (payment: Payment) => {
    try {
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(20);
      doc.text('Recibo de Pago', 105, 20, { align: 'center' });
      
      // Información del pago
      doc.setFontSize(12);
      doc.text(`Residente: ${payment.residentName}`, 20, 40);
      doc.text(`No. Registro: ${payment.noRegistro}`, 20, 47);
      doc.text(`Cédula: ${payment.cedula}`, 20, 54);
      doc.text(`Período: ${payment.monthName} ${payment.year}`, 20, 61);
      doc.text(`Monto: $${payment.amount.toFixed(2)}`, 20, 68);
      doc.text(`Fecha de Pago: ${payment.paymentDate ? format(new Date(payment.paymentDate), "dd/MM/yyyy") : 'No pagado'}`, 20, 75);
      doc.text(`Fecha de Vencimiento: ${payment.dueDate ? format(new Date(payment.dueDate), "dd/MM/yyyy") : 'N/A'}`, 20, 82);
      
      // Guardar el PDF
      doc.save(`recibo-${payment.noRegistro}-${payment.monthName}-${payment.year}.pdf`);
      
      toast({
        title: "Éxito",
        description: "Recibo generado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar el recibo",
        variant: "destructive",
      });
    }
  };

  const exportToExcel = (payment: Payment) => {
    try {
      const data = [
        ['Residente', payment.residentName],
        ['No. Registro', payment.noRegistro],
        ['Cédula', payment.cedula],
        ['Período', `${payment.monthName} ${payment.year}`],
        ['Monto', `$${payment.amount.toFixed(2)}`],
        ['Fecha de Pago', payment.paymentDate ? format(new Date(payment.paymentDate), "dd/MM/yyyy") : 'No pagado'],
        ['Fecha de Vencimiento', payment.dueDate ? format(new Date(payment.dueDate), "dd/MM/yyyy") : 'N/A'],
        ['Estado', payment.status === 'completed' ? 'Completado' : payment.status === 'pending' ? 'Pendiente' : 'Vencido']
      ];

      const doc = new jsPDF();
      autoTable(doc, {
        head: [['Campo', 'Valor']],
        body: data,
        startY: 20,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185] }
      });

      doc.save(`pago-${payment.noRegistro}-${payment.monthName}-${payment.year}.pdf`);
      
      toast({
        title: "Éxito",
        description: "Datos exportados correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron exportar los datos",
        variant: "destructive",
      });
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
                      Completado
                    </Badge>
                  ) : payment.status === "pending" ? (
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                      <Clock className="mr-1 h-3 w-3" />
                      Pendiente
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      Vencido
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
                        <span className="sr-only">Abrir menú</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/payments/${payment.id}`}>
                          <Eye className="mr-2 h-4 w-4" /> Ver detalles
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => generateReceipt(payment)}>
                        <Printer className="mr-2 h-4 w-4" /> Imprimir recibo
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => exportToExcel(payment)}>
                        <FileDown className="mr-2 h-4 w-4" /> Exportar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredPayments.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="space-y-3">
                    <FileDown className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                    <div>
                      <p className="text-lg font-medium">No se encontraron pagos</p>
                      <p className="text-muted-foreground">
                        {searchQuery ? 'Intenta con otros términos de búsqueda' : 'No hay pagos registrados'}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
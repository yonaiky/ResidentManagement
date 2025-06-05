import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Payment = {
  id: number;
  amount: number;
  paymentDate: string | null;
  dueDate: string | null;
  status: string;
  createdAt: string;
  residentId: number;
};

export function PaymentsList({ residentId }: { residentId: number }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPayments();
  }, [residentId]);

  const fetchPayments = async () => {
    try {
      const res = await fetch(`/api/residents/${residentId}/payments`);
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

  const generatePDF = () => {
    try {
      console.log('Iniciando generación de PDF...');
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(20);
      doc.text('Historial de Pagos', 105, 20, { align: 'center' });
      
      // Información del residente
      doc.setFontSize(12);
      doc.text(`Residente ID: ${residentId}`, 20, 30);
      
      // Tabla de pagos
      const tableData = payments.map(payment => [
        payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'Pendiente',
        payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : 'N/A',
        `$${payment.amount.toFixed(2)}`,
        payment.status
      ]);

      console.log('Datos de la tabla:', tableData);

      autoTable(doc, {
        startY: 40,
        head: [['Fecha de Pago', 'Fecha de Vencimiento', 'Monto', 'Estado']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185] }
      });

      // Total
      const total = payments.reduce((sum, payment) => sum + payment.amount, 0);
      doc.setFontSize(14);
      doc.text(`Total pagado: $${total.toFixed(2)}`, 190, (doc as any).lastAutoTable.finalY + 10, { align: 'right' });

      // Abrir PDF en nueva pestaña
      console.log('Generando URL del PDF...');
      const pdfDataUrl = doc.output('dataurlstring');
      console.log('URL del PDF generada');
      
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Historial de Pagos</title>
            </head>
            <body style="margin: 0; padding: 0;">
              <iframe 
                src="${pdfDataUrl}" 
                style="width: 100%; height: 100vh; border: none;"
              ></iframe>
            </body>
          </html>
        `);
      } else {
        throw new Error('No se pudo abrir la nueva ventana');
      }
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el PDF",
        variant: "destructive",
      });
    }
  };

  if (loading) return <div>Cargando pagos...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={generatePDF} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Ver PDF
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha de Pago</TableHead>
            <TableHead>Fecha de Vencimiento</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>{payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'Pendiente'}</TableCell>
              <TableCell>{payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : 'N/A'}</TableCell>
              <TableCell>${payment.amount.toFixed(2)}</TableCell>
              <TableCell>{payment.status}</TableCell>
            </TableRow>
          ))}
          {payments.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center">
                No hay pagos registrados
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
} 
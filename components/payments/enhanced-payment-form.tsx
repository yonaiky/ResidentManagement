"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { 
  Calendar, 
  CreditCard, 
  DollarSign, 
  FileText, 
  Plus, 
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download
} from "lucide-react";
import { format, addMonths, subMonths, isAfter, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Resident = {
  id: number;
  name: string;
  lastName: string;
  cedula: string;
  noRegistro: string;
  phone: string;
  address: string;
};

type MonthlyPayment = {
  month: number;
  year: number;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: Date;
  daysOverdue?: number;
  daysRemaining?: number;
};

interface EnhancedPaymentFormProps {
  resident: Resident;
  onSuccess: () => void;
  onClose: () => void;
}

export function EnhancedPaymentForm({ resident, onSuccess, onClose }: EnhancedPaymentFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<MonthlyPayment[]>([]);
  const [availableMonths, setAvailableMonths] = useState<MonthlyPayment[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<MonthlyPayment[]>([]);
  const [customAmount, setCustomAmount] = useState("");
  const [activeTab, setActiveTab] = useState("payment");

  const MONTHLY_AMOUNT = 700; // Monto mensual estándar

  useEffect(() => {
    loadPaymentData();
  }, [resident.id]);

  const loadPaymentData = async () => {
    try {
      const response = await fetch(`/api/residents/${resident.id}/payments`);
      if (response.ok) {
        const payments = await response.json();
        generatePaymentStatus(payments);
      }
    } catch (error) {
      console.error('Error loading payment data:', error);
      generatePaymentStatus([]);
    }
  };

  const generatePaymentStatus = (existingPayments: any[]) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Generar últimos 6 meses y próximos 6 meses
    const months: MonthlyPayment[] = [];
    const history: MonthlyPayment[] = [];
    const available: MonthlyPayment[] = [];

    // Últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(currentYear, currentMonth, 1), i);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const dueDate = new Date(year, date.getMonth(), 30);
      
      const existingPayment = existingPayments.find(p => p.month === month && p.year === year);
      const status = existingPayment ? 'paid' : (isAfter(today, dueDate) ? 'overdue' : 'pending');
      
      const monthData: MonthlyPayment = {
        month,
        year,
        amount: MONTHLY_AMOUNT,
        status,
        dueDate,
        daysOverdue: status === 'overdue' ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : undefined,
        daysRemaining: status === 'pending' ? Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : undefined
      };

      months.push(monthData);
      
      if (status === 'paid') {
        history.push(monthData);
      } else {
        available.push(monthData);
      }
    }

    // Próximos 6 meses
    for (let i = 1; i <= 6; i++) {
      const date = addMonths(new Date(currentYear, currentMonth, 1), i);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const dueDate = new Date(year, date.getMonth(), 30);
      
      const monthData: MonthlyPayment = {
        month,
        year,
        amount: MONTHLY_AMOUNT,
        status: 'pending',
        dueDate,
        daysRemaining: Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      };

      months.push(monthData);
      available.push(monthData);
    }

    setPaymentHistory(history);
    setAvailableMonths(available);
    
    // Auto-seleccionar meses vencidos
    const overdueMonths = available.filter(m => m.status === 'overdue');
    setSelectedMonths(overdueMonths);
  };

  const toggleMonthSelection = (month: MonthlyPayment) => {
    setSelectedMonths(prev => {
      const exists = prev.find(m => m.month === month.month && m.year === month.year);
      if (exists) {
        return prev.filter(m => !(m.month === month.month && m.year === month.year));
      } else {
        return [...prev, month];
      }
    });
  };

  const addCustomMonth = () => {
    if (!customAmount || parseFloat(customAmount) <= 0) {
      setError("Ingrese un monto válido");
      return;
    }

    const today = new Date();
    const customMonth: MonthlyPayment = {
      month: today.getMonth() + 1,
      year: today.getFullYear(),
      amount: parseFloat(customAmount),
      status: 'pending',
      dueDate: new Date(today.getFullYear(), today.getMonth(), 30)
    };

    setSelectedMonths(prev => [...prev, customMonth]);
    setCustomAmount("");
  };

  const removeSelectedMonth = (month: MonthlyPayment) => {
    setSelectedMonths(prev => 
      prev.filter(m => !(m.month === month.month && m.year === month.year))
    );
  };

  const getTotalAmount = () => {
    return selectedMonths.reduce((total, month) => total + month.amount, 0);
  };

  const generateInvoice = (payments: MonthlyPayment[]) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('FACTURA DE PAGO', 105, 20, { align: 'center' });
    
    // Resident info
    doc.setFontSize(12);
    doc.text(`Residente: ${resident.name} ${resident.lastName}`, 20, 40);
    doc.text(`Cédula: ${resident.cedula}`, 20, 47);
    doc.text(`No. Registro: ${resident.noRegistro}`, 20, 54);
    doc.text(`Teléfono: ${resident.phone}`, 20, 61);
    doc.text(`Dirección: ${resident.address}`, 20, 68);
    
    // Date
    doc.text(`Fecha: ${format(new Date(), 'dd/MM/yyyy', { locale: es })}`, 150, 40);
    
    // Payment details table
    const tableData = payments.map(payment => [
      `${format(new Date(payment.year, payment.month - 1), 'MMMM yyyy', { locale: es })}`,
      `$${payment.amount.toFixed(2)}`,
      format(payment.dueDate, 'dd/MM/yyyy'),
      payment.status === 'overdue' ? 'Vencido' : 'Pendiente'
    ]);

    autoTable(doc, {
      startY: 80,
      head: [['Período', 'Monto', 'Fecha de Vencimiento', 'Estado']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    // Total
    const total = getTotalAmount();
    doc.setFontSize(14);
    doc.text(`TOTAL A PAGAR: $${total.toFixed(2)}`, 150, (doc as any).lastAutoTable.finalY + 20);
    
    // Footer
    doc.setFontSize(10);
    doc.text('Gracias por su pago puntual', 105, (doc as any).lastAutoTable.finalY + 40, { align: 'center' });
    
    return doc;
  };

  const handleSubmit = async () => {
    if (selectedMonths.length === 0) {
      setError("Seleccione al menos un mes para pagar");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Procesar cada pago seleccionado
      for (const month of selectedMonths) {
        const response = await fetch(`/api/residents/${resident.id}/payments`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ 
            amount: month.amount,
            month: month.month,
            year: month.year
          })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Error al registrar el pago");
        }
      }

      // Generar y mostrar factura
      const invoice = generateInvoice(selectedMonths);
      const pdfDataUrl = invoice.output('dataurlstring');
      
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Factura de Pago - ${resident.name} ${resident.lastName}</title>
            </head>
            <body style="margin: 0; padding: 0;">
              <iframe 
                src="${pdfDataUrl}" 
                style="width: 100%; height: 100vh; border: none;"
              ></iframe>
            </body>
          </html>
        `);
      }

      toast({ 
        title: "Pagos registrados exitosamente", 
        description: `Se registraron ${selectedMonths.length} pago(s) por un total de $${getTotalAmount().toFixed(2)}` 
      });
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error completo:', err);
      setError(err instanceof Error ? err.message : "No se pudieron registrar los pagos");
      toast({ 
        title: "Error", 
        description: err instanceof Error ? err.message : "No se pudieron registrar los pagos", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-amber-600" />;
    }
  };

  const getStatusBadge = (month: MonthlyPayment) => {
    switch (month.status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Pagado</Badge>;
      case 'overdue':
        return (
          <Badge className="bg-red-100 text-red-800">
            Vencido ({month.daysOverdue} días)
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-100 text-amber-800">
            Pendiente ({month.daysRemaining} días)
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Registrar Pago
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Estado de Pagos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payment" className="space-y-6">
          {/* Información del Residente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Información del Residente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="font-medium">Nombre:</Label>
                  <p>{resident.name} {resident.lastName}</p>
                </div>
                <div>
                  <Label className="font-medium">Cédula:</Label>
                  <p>{resident.cedula}</p>
                </div>
                <div>
                  <Label className="font-medium">No. Registro:</Label>
                  <p>{resident.noRegistro}</p>
                </div>
                <div>
                  <Label className="font-medium">Teléfono:</Label>
                  <p>{resident.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meses Disponibles */}
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Meses a Pagar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {availableMonths.map((month) => (
                  <div
                    key={`${month.month}-${month.year}`}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedMonths.find(m => m.month === month.month && m.year === month.year)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleMonthSelection(month)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={!!selectedMonths.find(m => m.month === month.month && m.year === month.year)}
                        onChange={() => toggleMonthSelection(month)}
                      />
                      <div>
                        <p className="font-medium">
                          {format(new Date(month.year, month.month - 1), 'MMMM yyyy', { locale: es })}
                        </p>
                        <p className="text-sm text-gray-600">
                          Vence: {format(month.dueDate, 'dd/MM/yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">${month.amount.toFixed(2)}</span>
                      {getStatusBadge(month)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Agregar Monto Personalizado */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Agregar Monto Personalizado</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="number"
                    placeholder="Monto"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={addCustomMonth} variant="outline" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumen de Pagos Seleccionados */}
          {selectedMonths.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Pagos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedMonths.map((month) => (
                    <div
                      key={`selected-${month.month}-${month.year}`}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <span>
                        {format(new Date(month.year, month.month - 1), 'MMMM yyyy', { locale: es })}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">${month.amount.toFixed(2)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSelectedMonth(month)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>${getTotalAmount().toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button 
              onClick={handleSubmit} 
              disabled={loading || selectedMonths.length === 0}
              className="flex-1"
            >
              {loading ? "Procesando..." : `Registrar Pagos ($${getTotalAmount().toFixed(2)})`}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Estado de Pagos - Últimos 12 Meses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {paymentHistory.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No hay historial de pagos disponible
                  </p>
                ) : (
                  paymentHistory.map((month) => (
                    <div
                      key={`history-${month.month}-${month.year}`}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(month.status)}
                        <div>
                          <p className="font-medium">
                            {format(new Date(month.year, month.month - 1), 'MMMM yyyy', { locale: es })}
                          </p>
                          <p className="text-sm text-gray-600">
                            Vencimiento: {format(month.dueDate, 'dd/MM/yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold">${month.amount.toFixed(2)}</span>
                        {getStatusBadge(month)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
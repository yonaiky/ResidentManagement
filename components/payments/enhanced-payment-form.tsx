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
  Download,
  Receipt
} from "lucide-react";
import { format, addMonths, subMonths, isAfter, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import { DGIInvoiceGenerator, DEFAULT_COMPANY_INFO, type InvoiceData } from "@/lib/invoice-generator";

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

  const generateDGIInvoice = (payments: MonthlyPayment[]) => {
    const invoiceGenerator = new DGIInvoiceGenerator(DEFAULT_COMPANY_INFO);
    
    const invoiceData: InvoiceData = {
      resident,
      payments,
      invoiceNumber: DGIInvoiceGenerator.generateInvoiceNumber(),
      ncf: DGIInvoiceGenerator.generateNCF(),
      issueDate: new Date()
    };
    
    return invoiceGenerator.generateInvoice(invoiceData);
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

      // Generar factura DGI
      const invoice = generateDGIInvoice(selectedMonths);
      const pdfDataUrl = invoice.output('dataurlstring');
      
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Factura DGI - ${resident.name} ${resident.lastName}</title>
              <style>
                body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
                .header { background: #2980b9; color: white; padding: 10px; text-align: center; }
                .content { padding: 20px; }
                .info { background: #f8f9fa; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
                .download-btn { 
                  background: #27ae60; 
                  color: white; 
                  padding: 10px 20px; 
                  border: none; 
                  border-radius: 5px; 
                  cursor: pointer; 
                  margin: 10px;
                }
                .download-btn:hover { background: #219a52; }
              </style>
            </head>
            <body>
              <div class="header">
                <h2>📄 Factura Fiscal Generada</h2>
                <p>Factura conforme a las normativas de la DGI República Dominicana</p>
              </div>
              <div class="content">
                <div class="info">
                  <h3>✅ Pago Procesado Exitosamente</h3>
                  <p><strong>Cliente:</strong> ${resident.name} ${resident.lastName}</p>
                  <p><strong>Cédula:</strong> ${resident.cedula}</p>
                  <p><strong>Total Pagado:</strong> $${getTotalAmount().toFixed(2)} DOP</p>
                  <p><strong>Períodos:</strong> ${selectedMonths.length} mes(es)</p>
                  <p><strong>Fecha:</strong> ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
                </div>
                <button class="download-btn" onclick="window.print()">🖨️ Imprimir Factura</button>
                <button class="download-btn" onclick="downloadPDF()">💾 Descargar PDF</button>
              </div>
              <iframe 
                src="${pdfDataUrl}" 
                style="width: 100%; height: 70vh; border: 1px solid #ddd; border-radius: 5px;"
              ></iframe>
              <script>
                function downloadPDF() {
                  const link = document.createElement('a');
                  link.href = '${pdfDataUrl}';
                  link.download = 'Factura_${resident.cedula}_${format(new Date(), 'ddMMyyyy')}.pdf';
                  link.click();
                }
              </script>
            </body>
          </html>
        `);
      }

      toast({ 
        title: "✅ Pagos registrados exitosamente", 
        description: `Se registraron ${selectedMonths.length} pago(s) por un total de $${getTotalAmount().toFixed(2)} DOP. Factura fiscal generada.` 
      });
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error completo:', err);
      setError(err instanceof Error ? err.message : "No se pudieron registrar los pagos");
      toast({ 
        title: "❌ Error", 
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
        return <Badge className="bg-green-100 text-green-800">✅ Pagado</Badge>;
      case 'overdue':
        return (
          <Badge className="bg-red-100 text-red-800">
            ⚠️ Vencido ({month.daysOverdue} días)
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-100 text-amber-800">
            ⏳ Pendiente ({month.daysRemaining} días)
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
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
            <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/50 dark:to-green-950/50">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="font-medium">Nombre Completo:</Label>
                  <p className="text-lg">{resident.name} {resident.lastName}</p>
                </div>
                <div>
                  <Label className="font-medium">Cédula/RNC:</Label>
                  <p className="text-lg font-mono">{resident.cedula}</p>
                </div>
                <div>
                  <Label className="font-medium">No. Registro:</Label>
                  <p className="text-lg font-mono">{resident.noRegistro}</p>
                </div>
                <div>
                  <Label className="font-medium">Teléfono:</Label>
                  <p className="text-lg">{resident.phone}</p>
                </div>
                <div className="col-span-2">
                  <Label className="font-medium">Dirección:</Label>
                  <p>{resident.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meses Disponibles */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Seleccionar Períodos a Facturar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="grid gap-3">
                {availableMonths.map((month) => (
                  <div
                    key={`${month.month}-${month.year}`}
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedMonths.find(m => m.month === month.month && m.year === month.year)
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                    onClick={() => toggleMonthSelection(month)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={!!selectedMonths.find(m => m.month === month.month && m.year === month.year)}
                        onChange={() => toggleMonthSelection(month)}
                      />
                      <div>
                        <p className="font-medium text-lg">
                          {format(new Date(month.year, month.month - 1), 'MMMM yyyy', { locale: es })}
                        </p>
                        <p className="text-sm text-gray-600">
                          📅 Vence: {format(month.dueDate, 'dd/MM/yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-xl">${month.amount.toFixed(2)}</span>
                      {getStatusBadge(month)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Agregar Monto Personalizado */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">💰 Agregar Monto Personalizado</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="number"
                    placeholder="Monto en DOP"
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

          {/* Resumen de Facturación */}
          {selectedMonths.length > 0 && (
            <Card className="border-2 border-green-200 bg-green-50/50">
              <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100">
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Receipt className="h-5 w-5" />
                  Resumen de Facturación DGI
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {selectedMonths.map((month) => (
                    <div
                      key={`selected-${month.month}-${month.year}`}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border"
                    >
                      <span className="font-medium">
                        📋 {format(new Date(month.year, month.month - 1), 'MMMM yyyy', { locale: es })}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg">${month.amount.toFixed(2)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSelectedMonth(month)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Cálculos fiscales */}
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>${getTotalAmount().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>ITBIS (18%):</span>
                      <span>${(getTotalAmount() * 0.18).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xl border-t pt-2">
                      <span>💰 TOTAL A PAGAR:</span>
                      <span className="text-green-600">${(getTotalAmount() * 1.18).toFixed(2)} DOP</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button 
              onClick={handleSubmit} 
              disabled={loading || selectedMonths.length === 0}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              size="lg"
            >
              {loading ? (
                "🔄 Procesando..."
              ) : (
                `📄 Generar Factura DGI ($${(getTotalAmount() * 1.18).toFixed(2)} DOP)`
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
              size="lg"
            >
              Cancelar
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                📊 Historial de Pagos - Últimos 12 Meses
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-3">
                {paymentHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No hay historial de pagos disponible</p>
                    <p className="text-gray-400">Los pagos aparecerán aquí una vez procesados</p>
                  </div>
                ) : (
                  paymentHistory.map((month) => (
                    <div
                      key={`history-${month.month}-${month.year}`}
                      className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(month.status)}
                        <div>
                          <p className="font-medium text-lg">
                            📅 {format(new Date(month.year, month.month - 1), 'MMMM yyyy', { locale: es })}
                          </p>
                          <p className="text-sm text-gray-600">
                            Vencimiento: {format(month.dueDate, 'dd/MM/yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-xl">${month.amount.toFixed(2)}</span>
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
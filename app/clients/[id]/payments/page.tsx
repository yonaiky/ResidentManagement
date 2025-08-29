"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CreditCard, Plus, DollarSign, Calendar, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { Footer } from '@/components/ui/footer';
import { useToast } from "@/components/ui/use-toast";
import { PaymentsList } from "@/components/payments/PaymentsList";

type Payment = {
  id: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  status: string;
  description: string;
  clientId: number;
  planId: number | null;
  plan?: {
    id: number;
    name: string;
  };
};

type Client = {
  id: number;
  name: string;
  lastName: string;
  paymentStatus: string;
  lastPaymentDate: string | null;
  nextPaymentDate: string | null;
};

export default function ClientPaymentsPage({ params }: { params: { id: string } }) {
  const [client, setClient] = useState<Client | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const clientId = parseInt(params.id);

  useEffect(() => {
    fetchClient();
    fetchPayments();
  }, [clientId]);

  async function fetchClient() {
    try {
      const response = await fetch(`/api/clients/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setClient(data);
      }
    } catch (error) {
      console.error('Error fetching client:', error);
    }
  }

  async function fetchPayments() {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/payments?clientId=${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los pagos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  function getPaymentStatusBadge(status: string) {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendiente</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Fallido</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Vencido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function getPaymentStatusIcon(status: string) {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'failed':
      case 'overdue':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  }

  function getClientPaymentStatusBadge(status: string) {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Al día</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendiente</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Vencido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 pt-20 md:p-8 md:pt-20 lg:p-12 lg:pt-24">
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <CreditCard className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Cargando pagos...</p>
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  const totalPaid = payments
    .filter(payment => payment.status === 'completed')
    .reduce((total, payment) => total + payment.amount, 0);

  const pendingPayments = payments.filter(payment => payment.status === 'pending');
  const overduePayments = payments.filter(payment => payment.status === 'overdue');

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 pt-20 md:p-8 md:pt-20 lg:p-12 lg:pt-24">
          <div className="mx-auto max-w-7xl animate-fade-in">
            <div className="flex flex-col gap-8">
              {/* Header Section */}
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                    Pagos del Cliente
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    {client ? `Historial de pagos de ${client.name} ${client.lastName}` : 'Cargando...'}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" asChild>
                    <Link href={`/clients/${clientId}`}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Volver al Cliente
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/payments/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Registrar Pago
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Client Payment Status */}
              {client && (
                <Card className="card-hover">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50">
                    <CardTitle className="flex items-center gap-2">
                      <div className="rounded-lg bg-blue-500/10 p-2">
                        <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      Estado de Pago del Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="flex items-center gap-3">
                        {getPaymentStatusIcon(client.paymentStatus)}
                        <div>
                          <p className="text-sm text-muted-foreground">Estado General</p>
                          {getClientPaymentStatusBadge(client.paymentStatus)}
                        </div>
                      </div>
                      
                      {client.lastPaymentDate && (
                        <div>
                          <p className="text-sm text-muted-foreground">Último Pago</p>
                          <p className="font-semibold">
                            {new Date(client.lastPaymentDate).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      )}
                      
                      {client.nextPaymentDate && (
                        <div>
                          <p className="text-sm text-muted-foreground">Próximo Pago</p>
                          <p className="font-semibold">
                            {new Date(client.nextPaymentDate).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <p className="text-sm text-muted-foreground">Total Pagado</p>
                        <p className="font-semibold text-lg">${totalPaid.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="card-hover">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50">
                    <CardTitle className="flex items-center gap-2">
                      <div className="rounded-lg bg-blue-500/10 p-2">
                        <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      Total de Pagos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="text-3xl font-bold">{payments.length}</div>
                    <p className="text-sm text-muted-foreground">Pagos registrados</p>
                  </CardContent>
                </Card>

                <Card className="card-hover">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/50 dark:to-blue-950/50">
                    <CardTitle className="flex items-center gap-2">
                      <div className="rounded-lg bg-green-500/10 p-2">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      Pagos Completados
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="text-3xl font-bold">
                      {payments.filter(payment => payment.status === 'completed').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Pagos exitosos</p>
                  </CardContent>
                </Card>

                <Card className="card-hover">
                  <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/50 dark:to-orange-950/50">
                    <CardTitle className="flex items-center gap-2">
                      <div className="rounded-lg bg-yellow-500/10 p-2">
                        <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      Pagos Pendientes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="text-3xl font-bold">{pendingPayments.length}</div>
                    <p className="text-sm text-muted-foreground">Pagos por procesar</p>
                  </CardContent>
                </Card>

                <Card className="card-hover">
                  <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/50 dark:to-pink-950/50">
                    <CardTitle className="flex items-center gap-2">
                      <div className="rounded-lg bg-red-500/10 p-2">
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      Pagos Vencidos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="text-3xl font-bold">{overduePayments.length}</div>
                    <p className="text-sm text-muted-foreground">Pagos vencidos</p>
                  </CardContent>
                </Card>
              </div>

              {/* Payments List */}
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="rounded-lg bg-blue-500/10 p-2">
                      <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    Historial de Pagos ({payments.length})
                  </CardTitle>
                  <CardDescription>
                    Lista completa de todos los pagos realizados por el cliente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PaymentsList clientId={clientId} />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

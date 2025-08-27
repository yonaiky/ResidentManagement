"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FamilyMembersTable } from "@/components/family-members/family-members-table";
import { PaymentsList } from "@/components/payments/PaymentsList";
import {
  ArrowLeft,
  User,
  Users,
  Heart,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { Footer } from '@/components/ui/footer';
import { useToast } from "@/components/ui/use-toast";

type Client = {
  id: number;
  name: string;
  lastName: string;
  cedula: string;
  phone: string;
  email: string | null;
  address: string;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  paymentStatus: string;
  lastPaymentDate: string | null;
  nextPaymentDate: string | null;
  plans: any[];
  payments: any[];
  notifications: any[];
  familyMembers: any[];
  createdAt: string;
};

export default function ClientDetailsPage({ params }: { params: { id: string } }) {
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const clientId = parseInt(params.id);

  useEffect(() => {
    fetchClient();
  }, [clientId]);

  async function fetchClient() {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/clients/${clientId}`);
      
      if (response.ok) {
        const data = await response.json();
        setClient(data);
      } else {
        throw new Error('Error al obtener el cliente');
      }
    } catch (error) {
      console.error('Error fetching client:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información del cliente',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  function getPaymentStatusBadge(status: string) {
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

  function getPaymentStatusIcon(status: string) {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'overdue':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
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
                <User className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Cargando cliente...</p>
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 pt-20 md:p-8 md:pt-20 lg:p-12 lg:pt-24">
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <User className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Cliente no encontrado</p>
                <Button asChild className="mt-4">
                  <Link href="/clients">Volver a Clientes</Link>
                </Button>
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

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
                    Detalles del Cliente
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Información completa de {client.name} {client.lastName}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" asChild>
                    <Link href="/clients">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Volver a Clientes
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href={`/clients/${clientId}/edit`}>
                      Editar Cliente
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Client Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Personal Information */}
                <Card className="card-hover">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50">
                    <CardTitle className="flex items-center gap-2">
                      <div className="rounded-lg bg-blue-500/10 p-2">
                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      Información Personal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nombre Completo</label>
                      <p className="text-lg font-semibold">{client.name} {client.lastName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Cédula</label>
                      <p className="text-lg font-mono">{client.cedula}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{client.phone}</span>
                    </div>
                    {client.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{client.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{client.address}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Status */}
                <Card className="card-hover">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/50 dark:to-blue-950/50">
                    <CardTitle className="flex items-center gap-2">
                      <div className="rounded-lg bg-green-500/10 p-2">
                        <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      Estado de Pago
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      {getPaymentStatusIcon(client.paymentStatus)}
                      {getPaymentStatusBadge(client.paymentStatus)}
                    </div>
                    {client.lastPaymentDate && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Último Pago</label>
                        <p className="text-sm">{new Date(client.lastPaymentDate).toLocaleDateString('es-ES')}</p>
                      </div>
                    )}
                    {client.nextPaymentDate && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Próximo Pago</label>
                        <p className="text-sm">{new Date(client.nextPaymentDate).toLocaleDateString('es-ES')}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Emergency Contact */}
                <Card className="card-hover">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50">
                    <CardTitle className="flex items-center gap-2">
                      <div className="rounded-lg bg-orange-500/10 p-2">
                        <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      Contacto de Emergencia
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {client.emergencyContact ? (
                      <>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Contacto</label>
                          <p className="text-lg">{client.emergencyContact}</p>
                        </div>
                        {client.emergencyPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{client.emergencyPhone}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-muted-foreground">No especificado</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Tabs Section */}
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle>Información Detallada</CardTitle>
                  <CardDescription>
                    Gestión de planes, familiares y pagos del cliente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="family" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="family" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Familiares ({client.familyMembers?.length || 0})
                      </TabsTrigger>
                      <TabsTrigger value="plans" className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Planes ({client.plans?.length || 0})
                      </TabsTrigger>
                      <TabsTrigger value="payments" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Pagos ({client.payments?.length || 0})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="family" className="mt-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold">Familiares del Cliente</h3>
                          <Button asChild>
                            <Link href={`/clients/${clientId}/family-members`}>
                              <Users className="mr-2 h-4 w-4" />
                              Gestionar Familiares
                            </Link>
                          </Button>
                        </div>
                        <FamilyMembersTable clientId={clientId} />
                      </div>
                    </TabsContent>

                    <TabsContent value="plans" className="mt-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold">Planes del Cliente</h3>
                          <Button asChild>
                            <Link href={`/clients/${clientId}/plans`}>
                              <Heart className="mr-2 h-4 w-4" />
                              Gestionar Planes
                            </Link>
                          </Button>
                        </div>
                        {client.plans && client.plans.length > 0 ? (
                          <div className="grid gap-4">
                            {client.plans.map((plan) => (
                              <Card key={plan.id} className="p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-semibold">{plan.name}</h4>
                                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                                    <div className="flex gap-2 mt-2">
                                      <Badge variant="outline">{plan.planType}</Badge>
                                      <Badge variant="secondary">${plan.price}</Badge>
                                    </div>
                                  </div>
                                  <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                                    {plan.status}
                                  </Badge>
                                </div>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Heart className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-muted-foreground">No hay planes registrados</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="payments" className="mt-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold">Historial de Pagos</h3>
                          <Button asChild>
                            <Link href={`/clients/${clientId}/payments`}>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Registrar Pago
                            </Link>
                          </Button>
                        </div>
                        <PaymentsList clientId={clientId} />
                      </div>
                    </TabsContent>
                  </Tabs>
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



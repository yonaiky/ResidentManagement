"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, Plus, Calendar, DollarSign, Package } from "lucide-react";
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { Footer } from '@/components/ui/footer';
import { useToast } from "@/components/ui/use-toast";

type Plan = {
  id: number;
  name: string;
  description: string;
  planType: string;
  price: number;
  status: string;
  startDate: string;
  endDate: string | null;
  casket: {
    id: number;
    name: string;
    description: string;
  } | null;
  clientId: number;
};

type Client = {
  id: number;
  name: string;
  lastName: string;
};

export default function ClientPlansPage({ params }: { params: { id: string } }) {
  const [client, setClient] = useState<Client | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const clientId = parseInt(params.id);

  useEffect(() => {
    fetchClient();
    fetchPlans();
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

  async function fetchPlans() {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/plans?clientId=${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los planes',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Activo</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Inactivo</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Expirado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendiente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function getPlanTypeBadge(planType: string) {
    switch (planType) {
      case 'individual':
        return <Badge variant="secondary">Individual</Badge>;
      case 'family':
        return <Badge variant="secondary">Familiar</Badge>;
      case 'premium':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Premium</Badge>;
      default:
        return <Badge variant="outline">{planType}</Badge>;
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
                <Heart className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Cargando planes...</p>
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
                    Planes del Cliente
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    {client ? `Planes contratados por ${client.name} ${client.lastName}` : 'Cargando...'}
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
                    <Link href="/plans/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Nuevo Plan
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Plans Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="card-hover">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50">
                    <CardTitle className="flex items-center gap-2">
                      <div className="rounded-lg bg-blue-500/10 p-2">
                        <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      Total de Planes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="text-3xl font-bold">{plans.length}</div>
                    <p className="text-sm text-muted-foreground">Planes contratados</p>
                  </CardContent>
                </Card>

                <Card className="card-hover">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/50 dark:to-blue-950/50">
                    <CardTitle className="flex items-center gap-2">
                      <div className="rounded-lg bg-green-500/10 p-2">
                        <Heart className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      Planes Activos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="text-3xl font-bold">
                      {plans.filter(plan => plan.status === 'active').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Planes vigentes</p>
                  </CardContent>
                </Card>

                <Card className="card-hover">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50">
                    <CardTitle className="flex items-center gap-2">
                      <div className="rounded-lg bg-orange-500/10 p-2">
                        <DollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      Valor Total
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="text-3xl font-bold">
                      ${plans.reduce((total, plan) => total + plan.price, 0).toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">Valor de todos los planes</p>
                  </CardContent>
                </Card>
              </div>

              {/* Plans List */}
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="rounded-lg bg-blue-500/10 p-2">
                      <Heart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    Lista de Planes ({plans.length})
                  </CardTitle>
                  <CardDescription>
                    Detalles de todos los planes contratados por el cliente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {plans.length > 0 ? (
                    <div className="space-y-6">
                      {plans.map((plan) => (
                        <Card key={plan.id} className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                                  <p className="text-muted-foreground mb-3">{plan.description}</p>
                                </div>
                                <div className="flex gap-2">
                                  {getStatusBadge(plan.status)}
                                  {getPlanTypeBadge(plan.planType)}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm text-muted-foreground">Precio</p>
                                    <p className="font-semibold">${plan.price.toLocaleString()}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm text-muted-foreground">Fecha de Inicio</p>
                                    <p className="font-semibold">
                                      {new Date(plan.startDate).toLocaleDateString('es-ES')}
                                    </p>
                                  </div>
                                </div>
                                
                                {plan.endDate && (
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <p className="text-sm text-muted-foreground">Fecha de Fin</p>
                                      <p className="font-semibold">
                                        {new Date(plan.endDate).toLocaleDateString('es-ES')}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                
                                {plan.casket && (
                                  <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <p className="text-sm text-muted-foreground">Ataúd Incluido</p>
                                      <p className="font-semibold">{plan.casket.name}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex gap-2 lg:flex-col">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/plans/${plan.id}`}>
                                  Ver Detalles
                                </Link>
                              </Button>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/plans/${plan.id}/edit`}>
                                  Editar Plan
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No hay planes registrados</h3>
                      <p className="text-muted-foreground mb-4">
                        Este cliente aún no tiene planes contratados
                      </p>
                      <Button asChild>
                        <Link href="/plans/new">
                          <Plus className="mr-2 h-4 w-4" />
                          Contratar Primer Plan
                        </Link>
                      </Button>
                    </div>
                  )}
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

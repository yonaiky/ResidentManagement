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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FamilyMemberForm } from "@/components/FamilyMemberForm";
import { FamilyMembersTable } from "@/components/family-members/family-members-table";
import { ArrowLeft, Users, UserPlus } from "lucide-react";
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
};

export default function ClientFamilyMembersPage({ params }: { params: { id: string } }) {
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
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

  function handleFamilyMemberSuccess() {
    setDialogOpen(false);
    // La tabla se actualizará automáticamente
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
                <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
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
                <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
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
                    Familiares del Cliente
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Gestionar familiares de {client.name} {client.lastName}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" asChild>
                    <Link href={`/clients/${clientId}`}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Volver al Cliente
                    </Link>
                  </Button>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Agregar Familiar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Agregar Familiar</DialogTitle>
                        <DialogDescription>
                          Complete la información del familiar para {client.name} {client.lastName}
                        </DialogDescription>
                      </DialogHeader>
                      <FamilyMemberForm 
                        clientId={clientId} 
                        onSuccess={handleFamilyMemberSuccess}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Client Info Card */}
              <Card className="card-hover">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50">
                  <CardTitle className="flex items-center gap-2">
                    <div className="rounded-lg bg-blue-500/10 p-2">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    Información del Cliente Principal
                  </CardTitle>
                  <CardDescription>
                    Datos del cliente titular del plan
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nombre Completo</label>
                      <p className="text-lg font-semibold">{client.name} {client.lastName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Cédula</label>
                      <p className="text-lg font-mono">{client.cedula}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                      <p className="text-lg">{client.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-lg">{client.email || 'No especificado'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Family Members Table */}
              <Card className="card-hover">
                <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/50 dark:to-blue-950/50">
                  <CardTitle className="flex items-center gap-2">
                    <div className="rounded-lg bg-green-500/10 p-2">
                      <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    Lista de Familiares
                  </CardTitle>
                  <CardDescription>
                    Familiares que comparten el mismo plan funerario
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <FamilyMembersTable clientId={clientId} />
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


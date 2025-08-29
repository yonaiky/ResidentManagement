"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, User, Save } from "lucide-react";
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { Footer } from '@/components/ui/footer';
import { useToast } from "@/components/ui/use-toast";
import { ClientForm } from "@/components/ClientForm";

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
};

export default function EditClientPage({ params }: { params: { id: string } }) {
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
          <div className="mx-auto max-w-4xl animate-fade-in">
            <div className="flex flex-col gap-8">
              {/* Header Section */}
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                    Editar Cliente
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Modificar información de {client.name} {client.lastName}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" asChild>
                    <Link href={`/clients/${clientId}`}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Volver al Cliente
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Edit Form */}
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="rounded-lg bg-blue-500/10 p-2">
                      <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    Información del Cliente
                  </CardTitle>
                  <CardDescription>
                    Actualiza la información personal y de contacto del cliente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EditClientForm client={client} onSuccess={() => {
                    toast({
                      title: 'Cliente actualizado',
                      description: 'La información del cliente ha sido actualizada exitosamente',
                    });
                  }} />
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

// Componente de formulario de edición
function EditClientForm({ client, onSuccess }: { client: Client; onSuccess: () => void }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(data: any) {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el cliente');
      }
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Hubo un error al actualizar el cliente',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-sm font-medium text-muted-foreground" htmlFor="name">Nombre</label>
          <input
            type="text"
            defaultValue={client.name}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            id="name"
            placeholder="Nombre del cliente"
            title="Nombre del cliente"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground" htmlFor="lastName">Apellido</label>
          <input
            type="text"
            defaultValue={client.lastName}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            id="lastName"
            placeholder="Apellido del cliente"
            title="Apellido del cliente"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-sm font-medium text-muted-foreground" htmlFor="cedula">Cédula</label>
          <input
            type="text"
            defaultValue={client.cedula}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            id="cedula"
            placeholder="000-0000000-0"
            title="Número de cédula"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground" htmlFor="phone">Teléfono</label>
          <input
            type="text"
            defaultValue={client.phone}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            id="phone"
            placeholder="(809) 123-4567"
            title="Número de teléfono"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-sm font-medium text-muted-foreground" htmlFor="email">Email (Opcional)</label>
          <input
            type="email"
            defaultValue={client.email || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            id="email"
            placeholder="email@ejemplo.com"
            title="Dirección de correo electrónico"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground" htmlFor="address">Dirección</label>
          <input
            type="text"
            defaultValue={client.address}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            id="address"
            placeholder="Dirección completa"
            title="Dirección del cliente"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-sm font-medium text-muted-foreground" htmlFor="emergencyContact">Contacto de Emergencia (Opcional)</label>
          <input
            type="text"
            defaultValue={client.emergencyContact || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            id="emergencyContact"
            placeholder="Nombre del contacto de emergencia"
            title="Nombre del contacto de emergencia"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground" htmlFor="emergencyPhone">Teléfono de Emergencia (Opcional)</label>
          <input
            type="text"
            defaultValue={client.emergencyPhone || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            id="emergencyPhone"
            placeholder="(809) 123-4567"
            title="Teléfono de emergencia"
          />
        </div>
      </div>

      <Button 
        onClick={() => {
          const formData = {
            name: (document.getElementById('name') as HTMLInputElement).value,
            lastName: (document.getElementById('lastName') as HTMLInputElement).value,
            cedula: (document.getElementById('cedula') as HTMLInputElement).value,
            phone: (document.getElementById('phone') as HTMLInputElement).value,
            email: (document.getElementById('email') as HTMLInputElement).value,
            address: (document.getElementById('address') as HTMLInputElement).value,
            emergencyContact: (document.getElementById('emergencyContact') as HTMLInputElement).value,
            emergencyPhone: (document.getElementById('emergencyPhone') as HTMLInputElement).value,
          };
          onSubmit(formData);
        }}
        disabled={isLoading} 
        className="w-full"
      >
        <Save className="mr-2 h-4 w-4" />
        {isLoading ? "Actualizando..." : "Actualizar Cliente"}
      </Button>
    </div>
  );
}

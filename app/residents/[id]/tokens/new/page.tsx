"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Loader2, Key, Plus, User } from "lucide-react";
import Link from "next/link";
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { Footer } from '@/components/ui/footer';

const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
});

type FormData = z.infer<typeof formSchema>;

type Resident = {
  id: number;
  name: string;
  lastName: string;
  cedula: string;
  noRegistro: string;
};

export default function NewResidentTokenPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [resident, setResident] = useState<Resident | null>(null);
  const [loadingResident, setLoadingResident] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchResident();
    }
  }, [params.id]);

  const fetchResident = async () => {
    try {
      const response = await fetch(`/api/residents/${params.id}`);
      if (!response.ok) {
        throw new Error('Residente no encontrado');
      }
      const data = await response.json();
      setResident(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la información del residente",
        variant: "destructive",
      });
      router.push('/residents');
    } finally {
      setLoadingResident(false);
    }
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  async function onSubmit(data: FormData) {
    if (!resident) return;

    try {
      setIsLoading(true);
      const response = await fetch("/api/tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          residentId: resident.id.toString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Error creating token");
      }

      toast({
        title: "Éxito",
        description: "Token creado exitosamente",
      });

      router.push(`/residents/${resident.id}/tokens`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un error al crear el token",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (loadingResident) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 pt-20 md:p-8 md:pt-20 lg:p-12 lg:pt-24">
            <div className="mx-auto max-w-7xl animate-fade-in">
              <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground">Cargando información del residente...</p>
                </div>
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  if (!resident) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 pt-20 md:p-8 md:pt-20 lg:p-12 lg:pt-24">
            <div className="mx-auto max-w-7xl animate-fade-in">
              <div className="text-center py-12">
                <User className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h1 className="text-2xl font-bold text-muted-foreground mb-2">Residente no encontrado</h1>
                <p className="text-muted-foreground mb-4">
                  El residente que buscas no existe o ha sido eliminado.
                </p>
                <Button asChild>
                  <Link href="/residents">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Residentes
                  </Link>
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
              <div className="flex items-center gap-4">
                <Link href={`/residents/${resident.id}/tokens`}>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                    Nuevo Token
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Crear un nuevo token para {resident.name} {resident.lastName}
                  </p>
                </div>
              </div>

              {/* Resident Info Card */}
              <Card className="card-hover">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50">
                  <CardTitle className="flex items-center gap-2">
                    <div className="rounded-lg bg-blue-500/10 p-2">
                      <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    Residente Seleccionado
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                      <p className="text-lg font-semibold">{resident.name} {resident.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Cédula</p>
                      <p className="text-lg font-semibold">{resident.cedula}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">No. Registro</p>
                      <p className="text-lg font-semibold">{resident.noRegistro}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Token Form */}
              <Card className="card-hover max-w-2xl">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50">
                  <CardTitle className="flex items-center gap-2">
                    <div className="rounded-lg bg-purple-500/10 p-2">
                      <Key className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    Información del Token
                  </CardTitle>
                  <CardDescription>
                    Ingrese los detalles para el nuevo token de acceso
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre del Token</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: Token Principal, Token Secundario..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-4">
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creando...
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Crear Token
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => router.back()}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </Form>
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
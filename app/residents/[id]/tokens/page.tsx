"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResidentTokensTable } from "@/components/residents/resident-tokens-table";
import { ResidentParkingSection } from "@/components/residents/resident-parking-section";
import { Plus, ArrowLeft, User, Key } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type Resident = {
  id: number;
  name: string;
  lastName: string;
  cedula: string;
  noRegistro: string;
  phone: string;
  address: string;
};

export default function ResidentTokensPage() {
  const params = useParams();
  const { toast } = useToast();
  const [resident, setResident] = useState<Resident | null>(null);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground">Cargando información del residente...</p>
                </div>
              </div>
    );
  }

  if (!resident) {
    return (
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
    );
  }

  return (
    <div className="flex flex-col gap-8">
              {/* Header Section */}
              <div className="flex items-center gap-4">
                <Link href="/residents">
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div className="flex-1">
                  <h1 className="page-title">
                    Tokens de {resident.name} {resident.lastName}
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Gestiona los tokens de acceso asociados a este residente
                  </p>
                </div>
                <Button asChild>
                  <Link href={`/residents/${resident.id}/tokens/new`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Token
                  </Link>
                </Button>
              </div>

              {/* Resident Info Card */}
              <Card className="card-hover">
                <CardHeader className="card-accent-header">
                  <CardTitle className="flex items-center gap-2">
                    <div className="icon-badge">
                      <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    Información del Residente
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
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                      <p className="text-lg font-semibold">{resident.phone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <ResidentParkingSection residentId={resident.id} />

              {/* Tokens Table */}
              <Card className="card-hover">
                <CardHeader className="card-accent-header">
                  <CardTitle className="flex items-center gap-2">
                    <div className="icon-badge-violet">
                      <Key className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    Tokens Asignados
                  </CardTitle>
                  <CardDescription>
                    Lista de todos los tokens de acceso asignados a este residente
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <ResidentTokensTable residentId={resident.id} />
                </CardContent>
              </Card>
            </div>
  );
}
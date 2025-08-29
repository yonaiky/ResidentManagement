"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Plus, Edit, Trash2 } from "lucide-react";
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { Footer } from '@/components/ui/footer';
import { useToast } from "@/components/ui/use-toast";
import { FamilyMemberForm } from "@/components/FamilyMemberForm";
import { FamilyMembersTable } from "@/components/family-members/family-members-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type FamilyMember = {
  id: number;
  name: string;
  lastName: string;
  cedula: string;
  phone: string | null;
  email: string | null;
  relationship: string;
  dateOfBirth: string | null;
  clientId: number;
};

type Client = {
  id: number;
  name: string;
  lastName: string;
};

export default function FamilyMembersPage({ params }: { params: { id: string } }) {
  const [client, setClient] = useState<Client | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const { toast } = useToast();
  const clientId = parseInt(params.id);

  useEffect(() => {
    fetchClient();
    fetchFamilyMembers();
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

  async function fetchFamilyMembers() {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/family-members?clientId=${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setFamilyMembers(data);
      }
    } catch (error) {
      console.error('Error fetching family members:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los familiares',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteMember(memberId: number) {
    try {
      const response = await fetch(`/api/family-members/${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Familiar eliminado',
          description: 'El familiar ha sido eliminado exitosamente',
        });
        fetchFamilyMembers();
      } else {
        throw new Error('Error al eliminar el familiar');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Hubo un error al eliminar el familiar',
        variant: 'destructive',
      });
    }
  }

  function handleEditMember(member: FamilyMember) {
    setEditingMember(member);
    setIsAddDialogOpen(true);
  }

  function handleFormSuccess() {
    setIsAddDialogOpen(false);
    setEditingMember(null);
    fetchFamilyMembers();
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
                <p className="text-muted-foreground">Cargando familiares...</p>
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
                    {client ? `Gestión de familiares de ${client.name} ${client.lastName}` : 'Cargando...'}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" asChild>
                    <Link href={`/clients/${clientId}`}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Volver al Cliente
                    </Link>
                  </Button>
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar Familiar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingMember ? 'Editar Familiar' : 'Agregar Familiar'}
                        </DialogTitle>
                        <DialogDescription>
                          {editingMember 
                            ? 'Modifica la información del familiar'
                            : 'Agrega un nuevo familiar al cliente'
                          }
                        </DialogDescription>
                      </DialogHeader>
                      <FamilyMemberForm
                        clientId={clientId}
                        familyMemberId={editingMember?.id}
                        initialData={editingMember}
                        onSuccess={handleFormSuccess}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Family Members List */}
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="rounded-lg bg-blue-500/10 p-2">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    Lista de Familiares ({familyMembers.length})
                  </CardTitle>
                  <CardDescription>
                    Gestiona los familiares asociados al cliente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {familyMembers.length > 0 ? (
                    <div className="space-y-4">
                      {familyMembers.map((member) => (
                        <Card key={member.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-lg">
                                  {member.name} {member.lastName}
                                </h4>
                                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                  {member.relationship}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                                <div>
                                  <strong>Cédula:</strong> {member.cedula}
                                </div>
                                {member.phone && (
                                  <div>
                                    <strong>Teléfono:</strong> {member.phone}
                                  </div>
                                )}
                                {member.email && (
                                  <div>
                                    <strong>Email:</strong> {member.email}
                                  </div>
                                )}
                                {member.dateOfBirth && (
                                  <div>
                                    <strong>Fecha de Nacimiento:</strong> {new Date(member.dateOfBirth).toLocaleDateString('es-ES')}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditMember(member)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción no se puede deshacer. Se eliminará permanentemente el familiar "{member.name} {member.lastName}".
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteMember(member.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No hay familiares registrados</h3>
                      <p className="text-muted-foreground mb-4">
                        Comienza agregando el primer familiar del cliente
                      </p>
                      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Agregar Primer Familiar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Agregar Familiar</DialogTitle>
                            <DialogDescription>
                              Agrega el primer familiar al cliente
                            </DialogDescription>
                          </DialogHeader>
                          <FamilyMemberForm
                            clientId={clientId}
                            onSuccess={handleFormSuccess}
                          />
                        </DialogContent>
                      </Dialog>
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


"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Eye, MoreHorizontal, Search, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type FamilyMember = {
  id: number;
  name: string;
  lastName: string;
  cedula: string;
  phone: string | null;
  email: string | null;
  relationship: string;
  dateOfBirth: string | null;
  isActive: boolean;
  clientId: number;
  createdAt: string;
  client: {
    id: number;
    name: string;
    lastName: string;
    cedula: string;
  };
};

interface FamilyMembersTableProps {
  clientId?: number;
  showClientColumn?: boolean;
}

export function FamilyMembersTable({ clientId, showClientColumn = false }: FamilyMembersTableProps) {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [filteredFamilyMembers, setFilteredFamilyMembers] = useState<FamilyMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [familyMemberToDelete, setFamilyMemberToDelete] = useState<FamilyMember | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchFamilyMembers();
  }, [clientId]);

  useEffect(() => {
    filterFamilyMembers();
  }, [familyMembers, searchTerm]);

  async function fetchFamilyMembers() {
    try {
      setIsLoading(true);
      const url = clientId ? `/api/clients/${clientId}/family-members` : '/api/family-members';
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setFamilyMembers(data);
      } else {
        throw new Error('Error al obtener los familiares');
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

  function filterFamilyMembers() {
    if (!searchTerm.trim()) {
      setFilteredFamilyMembers(familyMembers);
      return;
    }

    const filtered = familyMembers.filter((member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.cedula.includes(searchTerm) ||
      member.relationship.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredFamilyMembers(filtered);
  }

  function handleDeleteClick(familyMember: FamilyMember) {
    setFamilyMemberToDelete(familyMember);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!familyMemberToDelete) return;

    try {
      const response = await fetch(`/api/family-members/${familyMemberToDelete.id}`, {
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
      console.error('Error deleting family member:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el familiar',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setFamilyMemberToDelete(null);
    }
  }

  function getRelationshipBadge(relationship: string) {
    const relationshipMap: { [key: string]: { label: string; variant: "default" | "secondary" | "destructive" | "outline" } } = {
      padre: { label: "Padre", variant: "default" },
      madre: { label: "Madre", variant: "default" },
      hijo: { label: "Hijo", variant: "secondary" },
      hija: { label: "Hija", variant: "secondary" },
      esposo: { label: "Esposo", variant: "outline" },
      esposa: { label: "Esposa", variant: "outline" },
      hermano: { label: "Hermano", variant: "secondary" },
      hermana: { label: "Hermana", variant: "secondary" },
      abuelo: { label: "Abuelo", variant: "outline" },
      abuela: { label: "Abuela", variant: "outline" },
      tio: { label: "Tío", variant: "secondary" },
      tia: { label: "Tía", variant: "secondary" },
      primo: { label: "Primo", variant: "outline" },
      prima: { label: "Prima", variant: "outline" },
      otro: { label: "Otro", variant: "outline" },
    };

    const config = relationshipMap[relationship] || { label: relationship, variant: "outline" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  }

  function getAge(dateOfBirth: string | null) {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Cargando familiares...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar familiares..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre Completo</TableHead>
              <TableHead>Cédula</TableHead>
              <TableHead>Parentesco</TableHead>
              {showClientColumn && <TableHead>Cliente Principal</TableHead>}
              <TableHead>Teléfono</TableHead>
              <TableHead>Edad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFamilyMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showClientColumn ? 8 : 7} className="text-center py-8">
                  <div className="text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {searchTerm ? 'No se encontraron familiares' : 'No hay familiares registrados'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredFamilyMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{member.name} {member.lastName}</div>
                      {member.email && (
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{member.cedula}</TableCell>
                  <TableCell>{getRelationshipBadge(member.relationship)}</TableCell>
                  {showClientColumn && (
                    <TableCell>
                      <div>
                        <div className="font-medium">{member.client.name} {member.client.lastName}</div>
                        <div className="text-sm text-muted-foreground">{member.client.cedula}</div>
                      </div>
                    </TableCell>
                  )}
                  <TableCell>{member.phone || '-'}</TableCell>
                  <TableCell>
                    {member.dateOfBirth ? (
                      <span>{getAge(member.dateOfBirth)} años</span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.isActive ? "default" : "secondary"}>
                      {member.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(member)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el familiar{' '}
              <strong>{familyMemberToDelete?.name} {familyMemberToDelete?.lastName}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


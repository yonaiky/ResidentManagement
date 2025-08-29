"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Edit,
  Eye,
  Heart,
  MoreHorizontal,
  Search,
  Trash2,
  Package,
  DollarSign
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Plan = {
  id: number;
  name: string;
  description: string | null;
  planType: string;
  price: number;
  duration: number | null;
  status: string;
  clientId: number;
  casketId: number | null;
  client: {
    id: number;
    name: string;
    lastName: string;
    cedula: string;
  };
  casket: {
    id: number;
    name: string;
    material: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export function PlansTable() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      const response = await fetch('/api/plans');
      if (!response.ok) {
        throw new Error('Error fetching plans');
      }
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar los planes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const filteredPlans = plans.filter((plan) =>
    plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.client.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.planType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (plan: Plan) => {
    try {
      const response = await fetch(`/api/plans/${plan.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error deleting plan');
      }

      toast({
        title: "Eliminado",
        description: "El plan ha sido eliminado exitosamente",
      });

      fetchPlans();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar el plan",
        variant: "destructive",
      });
    }
    setPlanToDelete(null);
  };

  const getPlanTypeBadge = (type: string) => {
    switch (type) {
      case 'funeral':
        return <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Funeral</Badge>;
      case 'cremation':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">Cremación</Badge>;
      case 'burial':
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Entierro</Badge>;
      case 'memorial':
        return <Badge variant="destructive">Memorial</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Activo</Badge>;
      case 'inactive':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">Inactivo</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Completado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: es });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando planes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre del plan, cliente o tipo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Ataúd</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="text-center">
                    <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-medium text-muted-foreground">
                      No se encontraron planes
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {searchQuery ? "Intenta con otros términos de búsqueda" : "No hay planes registrados aún"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredPlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{plan.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {plan.description || "Sin descripción"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {plan.client.name} {plan.client.lastName}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {plan.client.cedula}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getPlanTypeBadge(plan.planType)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-medium">{formatPrice(plan.price)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {plan.casket ? (
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">{plan.casket.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sin ataúd</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(plan.status)}
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
                        <DropdownMenuItem asChild>
                          <Link href={`/plans/${plan.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalles
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/plans/${plan.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setPlanToDelete(plan)}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!planToDelete} onOpenChange={() => setPlanToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el plan{" "}
              <span className="font-semibold">
                {planToDelete?.name}
              </span>{" "}
              y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => planToDelete && handleDelete(planToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

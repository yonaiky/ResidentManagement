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
  Package,
  MoreHorizontal,
  Search,
  Trash2,
  DollarSign,
  PackageCheck,
  PackageX
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

type Casket = {
  id: number;
  name: string;
  description: string | null;
  material: string;
  size: string | null;
  price: number;
  stock: number;
  status: string;
  plans: any[];
  createdAt: string;
  updatedAt: string;
};

export function CasketsTable() {
  const { toast } = useToast();
  const [caskets, setCaskets] = useState<Casket[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [casketToDelete, setCasketToDelete] = useState<Casket | null>(null);

  useEffect(() => {
    fetchCaskets();
  }, []);

  async function fetchCaskets() {
    try {
      const response = await fetch('/api/caskets');
      if (!response.ok) {
        throw new Error('Error fetching caskets');
      }
      const data = await response.json();
      setCaskets(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar los ataúdes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const filteredCaskets = caskets.filter((casket) =>
    casket.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    casket.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
    casket.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (casket: Casket) => {
    try {
      const response = await fetch(`/api/caskets/${casket.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error deleting casket');
      }

      toast({
        title: "Eliminado",
        description: "El ataúd ha sido eliminado exitosamente",
      });

      fetchCaskets();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar el ataúd",
        variant: "destructive",
      });
    }
    setCasketToDelete(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Disponible</Badge>;
      case 'reserved':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Reservado</Badge>;
      case 'sold':
        return <Badge variant="destructive">Vendido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStockBadge = (stock: number) => {
    if (stock > 10) {
      return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{stock} unidades</Badge>;
    } else if (stock > 0) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">{stock} unidades</Badge>;
    } else {
      return <Badge variant="destructive">Sin stock</Badge>;
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
          <p className="mt-2 text-sm text-muted-foreground">Cargando ataúdes...</p>
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
            placeholder="Buscar por nombre, material o descripción..."
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
              <TableHead>Nombre</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Tamaño</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Planes</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCaskets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="text-center">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-medium text-muted-foreground">
                      No se encontraron ataúdes
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {searchQuery ? "Intenta con otros términos de búsqueda" : "No hay ataúdes registrados aún"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCaskets.map((casket) => (
                <TableRow key={casket.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{casket.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {casket.description || "Sin descripción"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{casket.material}</Badge>
                  </TableCell>
                  <TableCell>
                    {casket.size || "No especificado"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-medium">{formatPrice(casket.price)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStockBadge(casket.stock)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(casket.status)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {casket.plans?.length || 0} planes
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
                        <DropdownMenuItem asChild>
                          <Link href={`/caskets/${casket.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalles
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/caskets/${casket.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setCasketToDelete(casket)}
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
      <AlertDialog open={!!casketToDelete} onOpenChange={() => setCasketToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el ataúd{" "}
              <span className="font-semibold">
                {casketToDelete?.name}
              </span>{" "}
              y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => casketToDelete && handleDelete(casketToDelete)}
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

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
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  Edit,
  Eye,
  Key,
  MoreHorizontal,
  Search,
  Trash2,
  UserCog,
  Bell,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
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
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PaymentForm } from "@/components/payments/PaymentForm";
import { PaymentsList } from "@/components/payments/PaymentsList";

type Resident = {
  id: number;
  name: string;
  lastName: string;
  cedula: string;
  noRegistro: string;
  phone: string;
  address: string;
  paymentStatus: string;
  lastPaymentDate: string | null;
  nextPaymentDate: string | null;
  tokens: any[];
  payments: any[];
  notifications: any[];
};

export function ResidentsTable() {
  const { toast } = useToast();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [residentToDelete, setResidentToDelete] = useState<Resident | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);

  useEffect(() => {
    fetchResidents();
  }, []);

  async function fetchResidents() {
    try {
      const response = await fetch('/api/residents');
      if (!response.ok) {
        throw new Error('Error fetching residents');
      }
      const data = await response.json();
      setResidents(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los residentes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleDelete = async (resident: Resident) => {
    setResidentToDelete(resident);
  };

  const confirmDelete = async () => {
    if (!residentToDelete) return;

    try {
      const response = await fetch(`/api/residents/${residentToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el residente');
      }

      setResidents(residents.filter(r => r.id !== residentToDelete.id));
      toast({
        title: "Residente eliminado",
        description: "El residente ha sido eliminado exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el residente",
        variant: "destructive",
      });
    } finally {
      setResidentToDelete(null);
    }
  };

  const handleSendAlert = async (resident: Resident) => {
    try {
      const response = await fetch(`/api/residents/${resident.id}/send-alert`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Error al enviar la alerta');
      }

      toast({
        title: "Alerta enviada",
        description: "La alerta de pago ha sido enviada correctamente",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar la alerta",
        variant: "destructive",
      });
    }
  };

  const filteredResidents = residents.filter(
    (resident) =>
      resident.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.cedula.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar residentes..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Registro</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Apellido</TableHead>
              <TableHead>Cédula</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Estado de Pago</TableHead>
              <TableHead>Próximo Pago</TableHead>
              <TableHead>Tokens</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  Cargando residentes...
                </TableCell>
              </TableRow>
            ) : filteredResidents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  No se encontraron residentes
                </TableCell>
              </TableRow>
            ) : (
              filteredResidents.map((resident) => (
                <TableRow key={resident.id}>
                  <TableCell>{resident.noRegistro}</TableCell>
                  <TableCell>{resident.name}</TableCell>
                  <TableCell>{resident.lastName}</TableCell>
                  <TableCell>{resident.cedula}</TableCell>
                  <TableCell>{resident.phone}</TableCell>
                  <TableCell>
                    {resident.paymentStatus === "paid" ? (
                      <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Pagado
                      </Badge>
                    ) : resident.paymentStatus === "pending" ? (
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                        <Clock className="mr-1 h-3 w-3" />
                        Pendiente
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Vencido
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {resident.nextPaymentDate
                      ? format(new Date(resident.nextPaymentDate), "dd/MM/yyyy")
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono">
                      {resident.tokens.length}
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
                        <DropdownMenuItem onClick={() => {
                          setSelectedResident(resident);
                          setShowPayments(true);
                        }}>
                          Ver Pagos
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedResident(resident);
                          setShowPaymentDialog(true);
                        }}>
                          <CreditCard className="mr-2 h-4 w-4" /> Registrar Pago
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/residents/${resident.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/residents/${resident.id}/tokens`}>
                            <Key className="mr-2 h-4 w-4" /> Gestionar Tokens
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedResident(resident);
                            setShowPayments(true);
                          }}
                        >
                          <UserCog className="mr-2 h-4 w-4" /> Historial de pagos
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(resident)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
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

      <Dialog open={showPayments} onOpenChange={setShowPayments}>
        <DialogContent className="max-w-3xl">
          <DialogTitle>Historial de Pagos</DialogTitle>
          {selectedResident && (
            <PaymentsList residentId={selectedResident.id} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogTitle>Registrar Pago</DialogTitle>
          {selectedResident && (
            <PaymentForm
              resident={selectedResident}
              onSuccess={() => {
                fetchResidents();
                setShowPaymentDialog(false);
              }}
              onClose={() => setShowPaymentDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!residentToDelete} onOpenChange={() => setResidentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el residente
              {residentToDelete && ` ${residentToDelete.name} ${residentToDelete.lastName}`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
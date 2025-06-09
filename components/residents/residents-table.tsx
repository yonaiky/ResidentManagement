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
  Phone,
  MapPin,
  User
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
import { EnhancedPaymentForm } from "@/components/payments/enhanced-payment-form";
import { PaymentsList } from "@/components/payments/PaymentsList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditResidentModal } from "@/components/residents/edit-resident-modal";

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [residentToEdit, setResidentToEdit] = useState<Resident | null>(null);

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

  const handleEdit = (resident: Resident) => {
    setResidentToEdit(resident);
    setShowEditModal(true);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="status-indicator status-paid">
            <CheckCircle className="h-3 w-3" />
            Pagado
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="status-indicator status-pending">
            <Clock className="h-3 w-3" />
            Pendiente
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className="status-indicator status-overdue">
            <AlertCircle className="h-3 w-3" />
            Vencido
          </Badge>
        );
      default:
        return (
          <Badge className="status-indicator status-pending">
            <Clock className="h-3 w-3" />
            Pendiente
          </Badge>
        );
    }
  };

  const filteredResidents = residents.filter(
    (resident) =>
      resident.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.cedula.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.noRegistro.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Cargando residentes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre, cédula, teléfono..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{filteredResidents.length} de {residents.length} residentes</span>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Lista de Residentes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Residente</TableHead>
                  <TableHead className="font-semibold">Contacto</TableHead>
                  <TableHead className="font-semibold">Registro</TableHead>
                  <TableHead className="font-semibold">Estado de Pago</TableHead>
                  <TableHead className="font-semibold">Próximo Pago</TableHead>
                  <TableHead className="font-semibold">Tokens</TableHead>
                  <TableHead className="text-right font-semibold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResidents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="space-y-3">
                        <User className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                        <div>
                          <p className="text-lg font-medium">No se encontraron residentes</p>
                          <p className="text-muted-foreground">
                            {searchQuery ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primer residente'}
                          </p>
                        </div>
                        {!searchQuery && (
                          <Button asChild>
                            <Link href="/residents/new">Agregar Residente</Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredResidents.map((resident) => (
                    <TableRow key={resident.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {resident.name} {resident.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {resident.cedula}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {resident.phone}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[200px]">{resident.address}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          #{resident.noRegistro}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(resident.paymentStatus)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {resident.nextPaymentDate
                            ? format(new Date(resident.nextPaymentDate), "dd/MM/yyyy")
                            : "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono">
                            {resident.tokens.length}
                          </Badge>
                          {resident.tokens.length > 0 && (
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/residents/${resident.id}/tokens`}>
                                <Key className="h-3 w-3" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => {
                              setSelectedResident(resident);
                              setShowPayments(true);
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Historial de Pagos
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedResident(resident);
                              setShowPaymentDialog(true);
                            }}>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Registrar Pago
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEdit(resident)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar Información
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/residents/${resident.id}/tokens`}>
                                <Key className="mr-2 h-4 w-4" />
                                Gestionar Tokens
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendAlert(resident)}>
                              <Bell className="mr-2 h-4 w-4" />
                              Enviar Recordatorio
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(resident)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar Residente
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
        </CardContent>
      </Card>

      {/* Modals */}
      <EditResidentModal
        resident={residentToEdit}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSuccess={fetchResidents}
      />

      <Dialog open={showPayments} onOpenChange={setShowPayments}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogTitle>
            Historial de Pagos - {selectedResident?.name} {selectedResident?.lastName}
          </DialogTitle>
          {selectedResident && (
            <PaymentsList residentId={selectedResident.id} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>
            Gestión de Pagos - {selectedResident?.name} {selectedResident?.lastName}
          </DialogTitle>
          {selectedResident && (
            <EnhancedPaymentForm
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
              {residentToDelete && ` ${residentToDelete.name} ${residentToDelete.lastName}`} y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
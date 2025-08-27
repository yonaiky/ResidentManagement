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
  Heart,
  MoreHorizontal,
  Search,
  Trash2,
  UserCog,
  Bell,
  Phone,
  MapPin,
  User,
  MessageCircle
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
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { EnhancedPaymentForm } from "@/components/payments/enhanced-payment-form";
import { PaymentsList } from "@/components/payments/PaymentsList";
import { SendMessageModal } from "@/components/whatsapp/send-message-modal";

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
  paymentStatus: string;
  lastPaymentDate: string | null;
  nextPaymentDate: string | null;
  plans: any[];
  payments: any[];
  notifications: any[];
  createdAt: string;
};

export function ClientsTable() {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [clientForWhatsApp, setClientForWhatsApp] = useState<Client | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) {
        throw new Error('Error fetching clients');
      }
      const data = await response.json();
      setClients(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar los clientes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.cedula.includes(searchQuery) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (client: Client) => {
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error deleting client');
      }

      toast({
        title: "Eliminado",
        description: "El cliente ha sido eliminado exitosamente",
      });

      fetchClients();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar el cliente",
        variant: "destructive",
      });
    }
    setClientToDelete(null);
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Pagado</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pendiente</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Vencido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No especificada";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: es });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando clientes...</p>
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
            placeholder="Buscar por nombre, apellido, cédula o email..."
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
              <TableHead>Cédula</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Estado de Pago</TableHead>
              <TableHead>Planes</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="text-center">
                    <User className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-medium text-muted-foreground">
                      No se encontraron clientes
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {searchQuery ? "Intenta con otros términos de búsqueda" : "No hay clientes registrados aún"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {client.name} {client.lastName}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {client.address}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{client.cedula}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>
                    {client.email || "No especificado"}
                  </TableCell>
                  <TableCell>
                    {getPaymentStatusBadge(client.paymentStatus)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {client.plans?.length || 0} planes
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
                          <Link href={`/clients/${client.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalles
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/clients/${client.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedClient(client);
                            setShowPaymentDialog(true);
                          }}
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Registrar pago
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedClient(client);
                            setShowPayments(true);
                          }}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          Ver pagos
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/clients/${client.id}/plans`}>
                            <Heart className="mr-2 h-4 w-4" />
                            Planes
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setClientForWhatsApp(client);
                            setShowWhatsAppModal(true);
                          }}
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Enviar WhatsApp
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setClientToDelete(client)}
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
      <AlertDialog open={!!clientToDelete} onOpenChange={() => setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente al cliente{" "}
              <span className="font-semibold">
                {clientToDelete?.name} {clientToDelete?.lastName}
              </span>{" "}
              y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clientToDelete && handleDelete(clientToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>Registrar Pago</DialogTitle>
          {selectedClient && (
            <EnhancedPaymentForm
              clientId={selectedClient.id}
              onSuccess={() => {
                setShowPaymentDialog(false);
                fetchClients();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Payments List Dialog */}
      <Dialog open={showPayments} onOpenChange={setShowPayments}>
        <DialogContent className="max-w-4xl">
          <DialogTitle>Historial de Pagos</DialogTitle>
          {selectedClient && (
            <PaymentsList clientId={selectedClient.id} />
          )}
        </DialogContent>
      </Dialog>

      {/* WhatsApp Modal */}
      {showWhatsAppModal && clientForWhatsApp && (
        <SendMessageModal
          open={showWhatsAppModal}
          onOpenChange={setShowWhatsAppModal}
          phone={clientForWhatsApp.phone}
          name={`${clientForWhatsApp.name} ${clientForWhatsApp.lastName}`}
        />
      )}
    </div>
  );
}

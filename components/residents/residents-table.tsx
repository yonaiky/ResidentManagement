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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { es } from "date-fns/locale";
import { AddPaymentDialog } from "./add-payment-dialog";
import { PaymentHistoryDialog } from "./payment-history-dialog";
import { BulkUploadDialog } from "./bulk-upload-dialog";
import { SendWhatsappDialog } from "./send-whatsapp-dialog";

type Resident = {
  id: number;
  name: string;
  apellido: string;
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
  createdAt: Date;
};

export function ResidentsTable() {
  const { toast } = useToast();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

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

  const filteredResidents = residents.filter(
    (resident) =>
      resident.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.cedula.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este residente?")) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/residents?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar el residente");
      }

      router.refresh();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysRemaining = (nextPaymentDate: string | null) => {
    if (!nextPaymentDate) return null;
    const today = new Date();
    const due = new Date(nextPaymentDate);
    const days = differenceInDays(due, today);
    return days;
  };

  const getDaysRemainingBadge = (paymentStatus: string, nextPaymentDate: string | null) => {
    if (paymentStatus !== "pending" || !nextPaymentDate) return null;
    
    const days = getDaysRemaining(nextPaymentDate);
    if (days === null) return null;

    if (days < 0) {
      return (
        <Badge variant="destructive" className="ml-2">
          Vencido
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="ml-2">
        {days} {days === 1 ? "día" : "días"} restantes
      </Badge>
    );
  };

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
        <BulkUploadDialog />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Apellido</TableHead>
              <TableHead>Cédula</TableHead>
              <TableHead>No. Registro</TableHead>
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
                  <TableCell className="font-medium">{resident.name}</TableCell>
                  <TableCell>{resident.apellido}</TableCell>
                  <TableCell>{resident.cedula}</TableCell>
                  <TableCell>{resident.noRegistro}</TableCell>
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
                    <div className="flex items-center">
                      {resident.nextPaymentDate ? (
                        <>
                          {format(new Date(resident.nextPaymentDate), "PPP", {
                            locale: es,
                          })}
                          {getDaysRemainingBadge(resident.paymentStatus, resident.nextPaymentDate)}
                        </>
                      ) : (
                        "No establecido"
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono">
                      {resident.tokens.length}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <PaymentHistoryDialog residentId={resident.id} residentName={resident.name} />
                      <AddPaymentDialog residentId={resident.id} residentName={resident.name} />
                      <SendWhatsappDialog residentId={resident.id} residentName={resident.name} />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/residents/${resident.id}`)}
                          >
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/residents/${resident.id}/edit`)}
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/tokens/new?residentId=${resident.id}`)}
                          >
                            Agregar Token
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
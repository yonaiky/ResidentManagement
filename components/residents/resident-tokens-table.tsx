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
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

type Token = {
  id: number;
  name: string;
  status: string;
  paymentStatus: string;
  lastPaymentDate: string | null;
  nextPaymentDate: string | null;
};

interface ResidentTokensTableProps {
  residentId: number;
}

export function ResidentTokensTable({ residentId }: ResidentTokensTableProps) {
  const { toast } = useToast();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTokens();
  }, [residentId]);

  async function fetchTokens() {
    try {
      const response = await fetch(`/api/residents/${residentId}/tokens`);
      if (!response.ok) {
        throw new Error('Error fetching tokens');
      }
      const data = await response.json();
      setTokens(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los tokens",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                Cargando tokens...
              </TableCell>
            </TableRow>
          ) : tokens.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                No se encontraron tokens
              </TableCell>
            </TableRow>
          ) : (
            tokens.map((token) => (
              <TableRow key={token.id}>
                <TableCell>{token.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={
                    token.status === "active" 
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                  }>
                    {token.status === "active" ? (
                      <CheckCircle className="mr-1 h-3 w-3" />
                    ) : (
                      <AlertCircle className="mr-1 h-3 w-3" />
                    )}
                    {token.status === "active" ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Abrir menú</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/tokens/${token.id}`}>
                          <Eye className="mr-2 h-4 w-4" /> Ver detalles
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/tokens/${token.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive">
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
  );
} 
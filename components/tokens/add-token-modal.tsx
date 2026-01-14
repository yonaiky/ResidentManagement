"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Key, Plus } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  residentId: z.string().min(1, "Por favor seleccione un residente"),
});

type FormData = z.infer<typeof formSchema>;

type Resident = {
  id: number;
  name: string;
  lastName: string;
  cedula: string;
};

interface AddTokenModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  preselectedResidentId?: number;
}

export function AddTokenModal({ open, onOpenChange, onSuccess, preselectedResidentId }: AddTokenModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loadingResidents, setLoadingResidents] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      residentId: preselectedResidentId?.toString() || "",
    },
  });

  useEffect(() => {
    if (open) {
      fetchResidents();
      if (preselectedResidentId) {
        form.setValue('residentId', preselectedResidentId.toString());
      }
    }
  }, [open, preselectedResidentId]);

  async function fetchResidents() {
    try {
      setLoadingResidents(true);
      const response = await fetch('/api/residents');
      if (!response.ok) throw new Error('Error fetching residents');
      const data = await response.json();
      setResidents(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los residentes",
        variant: "destructive",
      });
    } finally {
      setLoadingResidents(false);
    }
  }

  async function onSubmit(data: FormData) {
    try {
      setIsLoading(true);
      const response = await fetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Error creating token");

      toast({
        title: "Éxito",
        description: "Token creado exitosamente",
      });

      form.reset();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un error al crear el token",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="rounded-lg bg-purple-500/10 p-2">
              <Plus className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            Nuevo Token
          </DialogTitle>
          <DialogDescription>
            Crea un nuevo token y asígnalo a un residente
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Token</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingrese el nombre del token" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="residentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Residente</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={loadingResidents || !!preselectedResidentId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingResidents ? "Cargando..." : "Seleccione un residente"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {residents.map((resident) => (
                        <SelectItem key={resident.id} value={resident.id.toString()}>
                          {`${resident.name} ${resident.lastName} - ${resident.cedula}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crear Token'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

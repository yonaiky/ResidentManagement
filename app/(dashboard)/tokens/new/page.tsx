"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  residentId: z.string().min(1, {
    message: "Por favor seleccione un residente.",
  }),
});

type Resident = {
  id: number;
  name: string;
  lastName: string;
  cedula: string;
};

export default function NewTokenPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [residents, setResidents] = useState<Resident[]>([]);

  useEffect(() => {
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
      }
    }

    fetchResidents();
  }, [toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      residentId: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      const response = await fetch("/api/tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Error creating token");
      }

      toast({
        title: "Éxito",
        description: "Token creado exitosamente",
      });

      router.push("/tokens");
      router.refresh();
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Token</h1>
        <p className="text-muted-foreground">
          Cree un nuevo token y asígnelo a un residente
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Token</CardTitle>
          <CardDescription>
            Ingrese los detalles para el nuevo token
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un residente" />
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

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creando..." : "Crear Token"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
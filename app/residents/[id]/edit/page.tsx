"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { useToast } from "@/components/ui/use-toast";

const formSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  cedula: z.string().min(8, 'La cédula debe tener al menos 8 caracteres'),
  NoRegistro: z.string().min(1, 'El No. Registro es obligatorio'),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 caracteres'),
  address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
});

type FormData = z.infer<typeof formSchema>;

export default function EditResidentPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      lastName: '',
      cedula: '',
      NoRegistro: '',
      phone: '',
      address: '',
    },
  });

  useEffect(() => {
    async function fetchResident() {
      try {
        const response = await fetch(`/api/residents/${id}`);
        if (!response.ok) throw new Error('No se pudo cargar el residente');
        const data = await response.json();
        console.log('Datos del residente:', data); // Para depuración
        form.reset({
          name: data.name,
          lastName: data.lastName,
          cedula: data.cedula,
          NoRegistro: data.NoRegistro,
          phone: data.phone,
          address: data.address,
        });
      } catch (error) {
        console.error('Error al cargar el residente:', error); // Para depuración
        toast({
          title: 'Error',
          description: 'No se pudo cargar el residente',
          variant: 'destructive',
        });
      } finally {
        setLoadingData(false);
      }
    }
    if (id) fetchResident();
  }, [id, form, toast]);

  async function onSubmit(data: FormData) {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/residents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al actualizar el residente');
      toast({
        title: 'Residente actualizado',
        description: 'El residente ha sido actualizado exitosamente',
      });
      router.push('/residents');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Hubo un error al actualizar el residente',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (loadingData) return <div>Cargando datos...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editar Residente</h1>
        <p className="text-muted-foreground">Modifica los datos del residente</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido</FormLabel>
                <FormControl>
                  <Input placeholder="Apellido" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cedula"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cédula</FormLabel>
                <FormControl>
                  <Input placeholder="Número de cédula" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="NoRegistro"
            render={({ field }) => (
              <FormItem>
                <FormLabel>No. Registro</FormLabel>
                <FormControl>
                  <Input placeholder="No. Registro" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input placeholder="Número de teléfono" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Input placeholder="Dirección completa" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Actualizando...' : 'Actualizar Residente'}
          </Button>
        </form>
      </Form>
    </div>
  );
} 
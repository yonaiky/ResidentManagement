"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { formatCedula, formatPhone } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  apellido: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  cedula: z.string().regex(/^\d{3}-\d{7}-\d{1}$/, "La cédula debe tener el formato 000-0000000-0"),
  noRegistro: z.string().min(1, "El número de registro es requerido"),
  phone: z.string().regex(/^\d{3}-\d{3}-\d{4}$/, "El teléfono debe tener el formato 000-000-0000"),
  address: z.string().min(5, "La dirección debe tener al menos 5 caracteres"),
  nextPaymentDate: z.string().optional(),
  whatsappConsent: z.boolean().default(false).optional(),
});

interface ResidentFormProps {
  resident?: {
    id: number;
    name: string;
    apellido: string;
    cedula: string;
    phone: string;
    address: string;
    nextPaymentDate: Date | null;
    whatsappConsent?: boolean;
  };
}

export function ResidentForm({ resident }: ResidentFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: resident?.name || "",
      apellido: resident?.apellido || "",
      cedula: resident?.cedula || "",
      phone: resident?.phone || "",
      address: resident?.address || "",
      nextPaymentDate: resident?.nextPaymentDate 
        ? new Date(resident.nextPaymentDate).toISOString().split('T')[0]
        : undefined,
      whatsappConsent: resident?.whatsappConsent ?? false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const url = resident 
        ? `/api/residents?id=${resident.id}`
        : "/api/residents";
      
      const method = resident ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          id: resident?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al guardar el residente");
      }

      toast({
        title: resident ? "Residente actualizado" : "Residente creado",
        description: resident 
          ? "El residente ha sido actualizado exitosamente"
          : "El residente ha sido creado exitosamente",
      });

      router.push("/residents");
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un error al guardar el residente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre del residente" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="apellido"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido</FormLabel>
                <FormControl>
                  <Input placeholder="Apellido del residente" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="cedula"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cédula</FormLabel>
              <FormControl>
                <Input
                  placeholder="000-0000000-0"
                  {...field}
                  onChange={(e) => {
                    const value = formatCedula(e.target.value);
                    field.onChange(value);
                  }}
                  maxLength={13}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="noRegistro"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de Registro</FormLabel>
              <FormControl>
                <Input
                  placeholder="REG-0001"
                  {...field}
                />
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
                <Input
                  placeholder="000-000-0000"
                  {...field}
                  onChange={(e) => {
                    const value = formatPhone(e.target.value);
                    field.onChange(value);
                  }}
                  maxLength={12}
                />
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
                <Input placeholder="Dirección del residente" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nextPaymentDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha del próximo pago</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="whatsappConsent"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Consentimiento para recibir mensajes por WhatsApp
                </FormLabel>
                <FormDescription>
                  Permitir el envío de notificaciones y avisos por WhatsApp a este residente.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Guardando..." : resident ? "Actualizar" : "Crear"}
        </Button>
      </form>
    </Form>
  );
} 
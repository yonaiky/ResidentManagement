import { useState } from "react";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { LogoPreview } from "./logo-preview";

const fiscalConfigSchema = z.object({
  businessName: z.string().min(1, "El nombre de la empresa es requerido"),
  taxId: z.string().min(1, "El RUC es requerido"),
  address: z.string().min(1, "La dirección es requerida"),
  phone: z.string().min(1, "El teléfono es requerido"),
  email: z.string().email("El email no es válido"),
  website: z.string().url("La URL no es válida").optional().or(z.literal("")),
  logo: z.string().optional(),
});

type FiscalConfigFormValues = z.infer<typeof fiscalConfigSchema>;

interface FiscalConfigFormProps {
  initialData?: FiscalConfigFormValues;
}

export function FiscalConfigForm({ initialData }: FiscalConfigFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FiscalConfigFormValues>({
    resolver: zodResolver(fiscalConfigSchema),
    defaultValues: initialData || {
      businessName: "",
      taxId: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      logo: "",
    },
  });

  const onSubmit = async (data: FiscalConfigFormValues) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/fiscal-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Error al guardar la configuración");
      }

      toast({
        title: "Configuración guardada",
        description: "La configuración fiscal se ha guardado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la empresa</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Hotel Paradise Resort" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taxId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RUC</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 20123456789" {...field} />
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
                    <Input placeholder="Ej: Av. Principal 123, Ciudad" {...field} />
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
                    <Input placeholder="Ej: +51 987 654 321" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Ej: contacto@hotelparadise.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sitio web (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: https://www.hotelparadise.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-center">
            <FormField
              control={form.control}
              name="logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo de la empresa</FormLabel>
                  <FormControl>
                    <LogoPreview
                      currentLogo={field.value}
                      onLogoUpload={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar configuración"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 
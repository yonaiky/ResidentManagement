import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

const formSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  cedula: z.string().min(8, 'La cédula debe tener al menos 8 caracteres'),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 caracteres'),
  address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
});

type FormData = z.infer<typeof formSchema>;

export function ResidentForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      cedula: '',
      phone: '',
      address: '',
    },
  });

  async function onSubmit(data: FormData) {
    try {
      setIsLoading(true);
      const response = await fetch('/api/residents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al crear el residente');
      }

      const result = await response.json();
      
      toast({
        title: 'Residente creado',
        description: 'El residente ha sido creado exitosamente',
      });

      form.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Hubo un error al crear el residente',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Nombre completo" {...field} />
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
          {isLoading ? 'Creando...' : 'Crear Residente'}
        </Button>
      </form>
    </Form>
  );
} 
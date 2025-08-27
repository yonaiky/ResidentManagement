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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  name: z.string().min(1, "El nombre del ataúd es requerido"),
  description: z.string().optional(),
  material: z.string().min(1, "El material es requerido"),
  size: z.string().optional(),
  price: z.string().min(1, "El precio es requerido"),
  stock: z.string().min(1, "El stock es requerido"),
  status: z.enum(['available', 'reserved', 'sold'], {
    required_error: "Debe seleccionar un estado",
  }),
});

type FormData = z.infer<typeof formSchema>;

interface CasketFormProps {
  casketId?: number;
  initialData?: any;
}

export function CasketForm({ casketId, initialData }: CasketFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      material: initialData?.material || '',
      size: initialData?.size || '',
      price: initialData?.price?.toString() || '',
      stock: initialData?.stock?.toString() || '',
      status: initialData?.status || 'available',
    },
  });

  async function onSubmit(data: FormData) {
    try {
      setIsLoading(true);
      const url = casketId ? `/api/caskets/${casketId}` : '/api/caskets';
      const method = casketId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al guardar el ataúd');
      }
      
      toast({
        title: casketId ? 'Ataúd actualizado' : 'Ataúd creado',
        description: casketId 
          ? 'El ataúd ha sido actualizado exitosamente'
          : 'El ataúd ha sido creado exitosamente',
      });

      router.push('/caskets');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Hubo un error al guardar el ataúd',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Ataúd</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Ataúd de Madera Premium" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="material"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Material</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar material" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="madera">Madera</SelectItem>
                    <SelectItem value="metal">Metal</SelectItem>
                    <SelectItem value="fibra">Fibra</SelectItem>
                    <SelectItem value="carton">Cartón</SelectItem>
                    <SelectItem value="bambu">Bambú</SelectItem>
                    <SelectItem value="otros">Otros</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción (Opcional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descripción detallada del ataúd..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tamaño (Opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Estándar, Grande, Infantil" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="0.00" 
                    type="number" 
                    step="0.01"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Disponible</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="0" 
                    type="number"
                    min="0"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="available">Disponible</SelectItem>
                    <SelectItem value="reserved">Reservado</SelectItem>
                    <SelectItem value="sold">Vendido</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Guardando..." : (casketId ? "Actualizar Ataúd" : "Crear Ataúd")}
        </Button>
      </form>
    </Form>
  );
}

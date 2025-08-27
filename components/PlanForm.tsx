import { useState, useEffect } from 'react';
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
  name: z.string().min(1, "El nombre del plan es requerido"),
  description: z.string().optional(),
  planType: z.enum(['funeral', 'cremation', 'burial', 'memorial'], {
    required_error: "Debe seleccionar un tipo de plan",
  }),
  price: z.string().min(1, "El precio es requerido"),
  duration: z.string().optional(),
  clientId: z.string().min(1, "Debe seleccionar un cliente"),
  casketId: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

type Client = {
  id: number;
  name: string;
  lastName: string;
  cedula: string;
};

type Casket = {
  id: number;
  name: string;
  material: string;
  price: number;
  stock: number;
};

interface PlanFormProps {
  planId?: number;
  initialData?: any;
}

export function PlanForm({ planId, initialData }: PlanFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [caskets, setCaskets] = useState<Casket[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      planType: initialData?.planType || undefined,
      price: initialData?.price?.toString() || '',
      duration: initialData?.duration?.toString() || '',
      clientId: initialData?.clientId?.toString() || '',
      casketId: initialData?.casketId?.toString() || '',
    },
  });

  useEffect(() => {
    fetchClients();
    fetchCaskets();
  }, []);

  async function fetchClients() {
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  }

  async function fetchCaskets() {
    try {
      const response = await fetch('/api/caskets');
      if (response.ok) {
        const data = await response.json();
        setCaskets(data);
      }
    } catch (error) {
      console.error('Error fetching caskets:', error);
    }
  }

  async function onSubmit(data: FormData) {
    try {
      setIsLoading(true);
      const url = planId ? `/api/plans/${planId}` : '/api/plans';
      const method = planId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al guardar el plan');
      }
      
      toast({
        title: planId ? 'Plan actualizado' : 'Plan creado',
        description: planId 
          ? 'El plan ha sido actualizado exitosamente'
          : 'El plan ha sido creado exitosamente',
      });

      router.push('/plans');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Hubo un error al guardar el plan',
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
                <FormLabel>Nombre del Plan</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Plan Funeral Básico" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="planType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Plan</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo de plan" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="funeral">Funeral</SelectItem>
                    <SelectItem value="cremation">Cremación</SelectItem>
                    <SelectItem value="burial">Entierro</SelectItem>
                    <SelectItem value="memorial">Memorial</SelectItem>
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
                  placeholder="Descripción detallada del plan..."
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

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duración en meses (Opcional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="12" 
                    type="number"
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
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name} {client.lastName} - {client.cedula}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="casketId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ataúd (Opcional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar ataúd" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Sin ataúd</SelectItem>
                    {caskets.map((casket) => (
                      <SelectItem key={casket.id} value={casket.id.toString()}>
                        {casket.name} - {casket.material} (${casket.price})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Guardando..." : (planId ? "Actualizar Plan" : "Crear Plan")}
        </Button>
      </form>
    </Form>
  );
}

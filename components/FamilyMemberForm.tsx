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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { IMaskInput } from 'react-imask';

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  cedula: z.string().min(1, "La cédula es requerida"),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  relationship: z.enum(['padre', 'madre', 'hijo', 'hija', 'esposo', 'esposa', 'hermano', 'hermana', 'abuelo', 'abuela', 'tio', 'tia', 'primo', 'prima', 'otro'], {
    required_error: "Debe seleccionar un parentesco",
  }),
  dateOfBirth: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface FamilyMemberFormProps {
  clientId: number;
  familyMemberId?: number;
  initialData?: any;
  onSuccess?: () => void;
}

export function FamilyMemberForm({ clientId, familyMemberId, initialData, onSuccess }: FamilyMemberFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      lastName: initialData?.lastName || '',
      cedula: initialData?.cedula || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      relationship: initialData?.relationship || undefined,
      dateOfBirth: initialData?.dateOfBirth ? new Date(initialData.dateOfBirth).toISOString().split('T')[0] : '',
    },
  });

  async function onSubmit(data: FormData) {
    try {
      setIsLoading(true);
      const url = familyMemberId ? `/api/family-members/${familyMemberId}` : '/api/family-members';
      const method = familyMemberId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          clientId: clientId.toString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar el familiar');
      }
      
      toast({
        title: familyMemberId ? 'Familiar actualizado' : 'Familiar agregado',
        description: familyMemberId 
          ? 'El familiar ha sido actualizado exitosamente'
          : 'El familiar ha sido agregado exitosamente',
      });

      form.reset();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Hubo un error al guardar el familiar',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="cedula"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cédula</FormLabel>
                <FormControl>
                  <IMaskInput
                    mask="000-0000000-0"
                    placeholder="000-0000000-0"
                    {...field}
                    render={(inputProps, ref) => (
                      <Input {...inputProps} ref={ref} />
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="relationship"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parentesco</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar parentesco" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="padre">Padre</SelectItem>
                    <SelectItem value="madre">Madre</SelectItem>
                    <SelectItem value="hijo">Hijo</SelectItem>
                    <SelectItem value="hija">Hija</SelectItem>
                    <SelectItem value="esposo">Esposo</SelectItem>
                    <SelectItem value="esposa">Esposa</SelectItem>
                    <SelectItem value="hermano">Hermano</SelectItem>
                    <SelectItem value="hermana">Hermana</SelectItem>
                    <SelectItem value="abuelo">Abuelo</SelectItem>
                    <SelectItem value="abuela">Abuela</SelectItem>
                    <SelectItem value="tio">Tío</SelectItem>
                    <SelectItem value="tia">Tía</SelectItem>
                    <SelectItem value="primo">Primo</SelectItem>
                    <SelectItem value="prima">Prima</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono (Opcional)</FormLabel>
                <FormControl>
                  <IMaskInput
                    mask="(000) 000-0000"
                    placeholder="(809) 123-4567"
                    {...field}
                    render={(inputProps, ref) => (
                      <Input {...inputProps} ref={ref} />
                    )}
                  />
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
                <FormLabel>Email (Opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="email@ejemplo.com" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de Nacimiento (Opcional)</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Guardando..." : (familyMemberId ? "Actualizar Familiar" : "Agregar Familiar")}
        </Button>
      </form>
    </Form>
  );
}


"use client";

import { useEffect, useState } from "react";
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
import { Loader2, UserPlus } from "lucide-react";

const formSchema = z.object({
  username: z
    .string()
    .min(3, "El usuario debe tener al menos 3 caracteres")
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "Solo letras, números, punto, guion o guion bajo (sin espacios)"
    ),
  email: z.string().email("Por favor ingrese un email válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.enum(["user", "manager", "tenant_admin", "technician"]),
});

type FormData = z.infer<typeof formSchema>;

const emptyValues: FormData = {
  username: "",
  email: "",
  password: "",
  role: "user",
};

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddUserModal({ open, onOpenChange, onSuccess }: AddUserModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(emptyValues);
    }
  }, [open, form]);

  async function onSubmit(data: FormData) {
    try {
      setIsLoading(true);
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          username: data.username.trim(),
          email: data.email.trim().toLowerCase(),
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Failed to create user");
      }

      toast({
        title: "Usuario creado",
        description: `El usuario ${result.username} ha sido creado exitosamente`,
      });

      form.reset(emptyValues);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al crear el usuario",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset(emptyValues);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="rounded-lg bg-indigo-500/10 p-2">
              <UserPlus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            Nuevo Usuario
          </DialogTitle>
          <DialogDescription>
            Crea un usuario en la organización activa
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            autoComplete="off"
          >
            {/* Honeypot fields to discourage browser autofill */}
            <input
              type="text"
              name="prevent_autofill_user"
              autoComplete="username"
              className="hidden"
              tabIndex={-1}
              aria-hidden
              readOnly
            />
            <input
              type="password"
              name="prevent_autofill_pass"
              autoComplete="current-password"
              className="hidden"
              tabIndex={-1}
              aria-hidden
              readOnly
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usuario</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ej. jeiliani.mateo"
                      autoComplete="off"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      {...field}
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Ingresa la dirección de email"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Ingresa la contraseña"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol en la organización</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">Usuario</SelectItem>
                      <SelectItem value="manager">Gerente</SelectItem>
                      <SelectItem value="technician">Técnico</SelectItem>
                      <SelectItem value="tenant_admin">Administrador</SelectItem>
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
                  "Crear Usuario"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

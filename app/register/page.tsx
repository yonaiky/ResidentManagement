"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, User, Mail, Lock, Building2, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LoginLayout } from "@/components/auth/login-layout";

const formSchema = z
  .object({
    username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
    email: z.string().email("Ingresa un email válido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof formSchema>;

export default function RegisterPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: FormData) {
    try {
      setIsLoading(true);

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { username: data.username },
          emailRedirectTo: `${appUrl}/auth/callback`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Revisa tu email",
        description:
          "Te enviamos un enlace de confirmación. Debes confirmar tu cuenta antes de iniciar sesión.",
      });

      router.push("/login");
    } catch (error) {
      toast({
        title: "Error en el registro",
        description: error instanceof Error ? error.message : "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <LoginLayout>
      <Card className="landing-glass relative w-full max-w-md border-white/10 shadow-2xl shadow-violet-500/10">
        <CardHeader className="space-y-4 text-center pb-8">
          <Link
            href="/login"
            className="absolute left-6 top-6 rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex justify-center mb-6">
            <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 p-4 shadow-lg">
              <Building2 className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">Crear cuenta</CardTitle>
          <CardDescription className="text-slate-400">
            Regístrate como usuario. Un administrador puede asignarte otros roles después.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Usuario</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Nombre de usuario"
                          className="h-11 border-white/10 bg-white/5 pl-10 text-white placeholder:text-slate-500"
                          {...field}
                        />
                      </div>
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
                    <FormLabel className="text-slate-300">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="tu@email.com"
                          className="h-11 border-white/10 bg-white/5 pl-10 text-white placeholder:text-slate-500"
                          {...field}
                        />
                      </div>
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
                    <FormLabel className="text-slate-300">Contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="Contraseña"
                          className="h-11 border-white/10 bg-white/5 pl-10 text-white placeholder:text-slate-500"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Confirmar contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="Confirmar"
                          className="h-11 border-white/10 bg-white/5 pl-10 text-white placeholder:text-slate-500"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="h-11 w-full bg-gradient-to-r from-blue-600 to-violet-600 shadow-lg shadow-violet-500/25"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  "Crear Cuenta"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-white/5 pt-6">
          <p className="text-sm text-slate-400">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-medium text-violet-400 hover:text-violet-300">
              Inicia sesión
            </Link>
          </p>
        </CardFooter>
      </Card>
    </LoginLayout>
  );
}


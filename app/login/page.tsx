"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Loader2, User, Lock, Building2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LoginLayout } from "@/components/auth/login-layout";

const formSchema = z.object({
  identifier: z.string().min(1, "Usuario o email es requerido"),
  password: z.string().min(1, "Contraseña es requerida"),
});

type FormData = z.infer<typeof formSchema>;

function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (searchParams.get("unconfirmed") === "1") {
      toast({
        title: "Confirma tu email",
        description: "Revisa tu bandeja de entrada y haz clic en el enlace de confirmación.",
        variant: "destructive",
      });
    }
    if (searchParams.get("error") === "auth_callback") {
      toast({
        title: "Error de autenticación",
        description: "No se pudo completar el inicio de sesión. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { identifier: "", password: "" },
  });

  async function onSubmit(data: FormData) {
    try {
      setIsLoading(true);

      const resolveRes = await fetch("/api/auth/resolve-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: data.identifier }),
      });

      const resolveData = await resolveRes.json();
      if (!resolveRes.ok) {
        throw new Error(resolveData.error || "Credenciales inválidas");
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: resolveData.email,
        password: data.password,
      });

      if (error) {
        if (error.message.toLowerCase().includes("email not confirmed")) {
          throw new Error("Confirma tu email antes de iniciar sesión.");
        }
        throw new Error(error.message);
      }

      toast({
        title: "¡Bienvenido de vuelta!",
        description: "Has iniciado sesión correctamente.",
      });

      const from = searchParams.get("from");
      router.push(from && from !== "/" ? from : "/dashboard");
      router.refresh();
    } catch (error) {
      toast({
        title: "Error de autenticación",
        description: error instanceof Error ? error.message : "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="landing-glass w-full max-w-md border-white/10 shadow-2xl shadow-violet-500/10">
      <CardHeader className="space-y-4 pb-6 text-center">
        <div className="flex justify-center lg:hidden">
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 p-3 shadow-lg shadow-violet-500/25">
            <Building2 className="h-8 w-8 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-white">Iniciar sesión</CardTitle>
        <CardDescription className="text-slate-400">
          Accede a tu cuenta de Resident Management
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="identifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Usuario o Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <Input
                        placeholder="Usuario o email"
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
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Contraseña"
                        className="h-11 border-white/10 bg-white/5 pl-10 pr-10 text-white placeholder:text-slate-500"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="text-right">
              <Link href="/forgot-password" className="text-sm text-violet-400 hover:text-violet-300">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Button
              type="submit"
              className="h-11 w-full bg-gradient-to-r from-blue-600 to-violet-600 shadow-lg shadow-violet-500/25"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar sesión"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-white/5 pt-6">
        <p className="text-sm text-slate-400">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="font-medium text-violet-400 hover:text-violet-300">
            Regístrate
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <LoginLayout>
      <Suspense
        fallback={
          <div className="flex h-64 w-full max-w-md items-center justify-center text-slate-400">
            Cargando...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </LoginLayout>
  );
}

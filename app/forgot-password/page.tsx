"use client";

import { useState } from "react";
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
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const formSchema = z.object({
  email: z.string().email("Ingresa un email válido"),
});

type FormData = z.infer<typeof formSchema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(data: FormData) {
    try {
      setIsLoading(true);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${appUrl}/reset-password`,
      });

      if (error) throw new Error(error.message);

      setSent(true);
      toast({
        title: "Email enviado",
        description: "Revisa tu bandeja de entrada para restablecer tu contraseña.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo enviar el email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link href="/login" className="inline-flex items-center text-sm text-muted-foreground mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver al login
          </Link>
          <CardTitle>Recuperar contraseña</CardTitle>
          <CardDescription>
            {sent
              ? "Si el email existe, recibirás un enlace para restablecer tu contraseña."
              : "Ingresa tu email y te enviaremos un enlace de recuperación."}
          </CardDescription>
        </CardHeader>
        {!sent && (
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input type="email" className="pl-10" placeholder="tu@email.com" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar enlace"}
                </Button>
              </form>
            </Form>
          </CardContent>
        )}
        <CardFooter className="justify-center">
          <Link href="/login" className="text-sm text-blue-600 hover:underline">
            Iniciar sesión
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

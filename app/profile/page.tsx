"use client";

import { useState, useEffect } from "react";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, User, Lock, Shield, Settings } from "lucide-react";
import { format } from "date-fns";
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { Footer } from '@/components/ui/footer';

const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileData = z.infer<typeof profileSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

type User = {
  id: number;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

export default function ProfilePage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
      email: "",
    },
  });

  const passwordForm = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        profileForm.reset({
          username: data.user.username,
          email: data.user.email,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load user profile",
        variant: "destructive",
      });
    }
  };

  async function onProfileSubmit(data: ProfileData) {
    if (!user) return;

    try {
      setIsLoadingProfile(true);
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update profile");
      }

      setUser(result);
      toast({
        title: "Perfil actualizado",
        description: "Tu perfil ha sido actualizado exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProfile(false);
    }
  }

  async function onPasswordSubmit(data: PasswordData) {
    try {
      setIsLoadingPassword(true);
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to change password");
      }

      passwordForm.reset();
      toast({
        title: "Contraseña cambiada",
        description: "Tu contraseña ha sido cambiada exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPassword(false);
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'manager':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 pt-20 md:p-8 md:pt-20 lg:p-12 lg:pt-24">
            <div className="mx-auto max-w-7xl animate-fade-in">
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 pt-20 md:p-8 md:pt-20 lg:p-12 lg:pt-24">
          <div className="mx-auto max-w-7xl animate-fade-in">
            <div className="flex flex-col gap-8">
              {/* Header Section */}
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                  Mi Perfil
                </h1>
                <p className="text-lg text-muted-foreground">
                  Administra la configuración de tu cuenta y preferencias
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-1 card-hover">
                  <CardHeader className="text-center">
                    <div className="mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-4 w-fit">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle>{user.username}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Rol</span>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        <Shield className="mr-1 h-3 w-3" />
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Estado</span>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Miembro desde</span>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(user.createdAt), "MMM yyyy")}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <div className="md:col-span-2">
                  <Tabs defaultValue="profile" className="space-y-4">
                    <TabsList>
                      <TabsTrigger value="profile" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Información del Perfil
                      </TabsTrigger>
                      <TabsTrigger value="password" className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Cambiar Contraseña
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile">
                      <Card className="card-hover">
                        <CardHeader>
                          <CardTitle>Información del Perfil</CardTitle>
                          <CardDescription>
                            Actualiza la información de tu cuenta
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                              <FormField
                                control={profileForm.control}
                                name="username"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Usuario</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Ingresa tu usuario" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={profileForm.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                      <Input type="email" placeholder="Ingresa tu email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <Button type="submit" disabled={isLoadingProfile}>
                                {isLoadingProfile ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Actualizando...
                                  </>
                                ) : (
                                  "Actualizar Perfil"
                                )}
                              </Button>
                            </form>
                          </Form>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="password">
                      <Card className="card-hover">
                        <CardHeader>
                          <CardTitle>Cambiar Contraseña</CardTitle>
                          <CardDescription>
                            Actualiza tu contraseña para mantener tu cuenta segura
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Form {...passwordForm}>
                            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                              <FormField
                                control={passwordForm.control}
                                name="currentPassword"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Contraseña Actual</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                          type="password"
                                          placeholder="Ingresa tu contraseña actual"
                                          className="pl-10"
                                          {...field}
                                        />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={passwordForm.control}
                                name="newPassword"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Nueva Contraseña</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                          type="password"
                                          placeholder="Ingresa tu nueva contraseña"
                                          className="pl-10"
                                          {...field}
                                        />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={passwordForm.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                          type="password"
                                          placeholder="Confirma tu nueva contraseña"
                                          className="pl-10"
                                          {...field}
                                        />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <Button type="submit" disabled={isLoadingPassword}>
                                {isLoadingPassword ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Cambiando...
                                  </>
                                ) : (
                                  "Cambiar Contraseña"
                                )}
                              </Button>
                            </form>
                          </Form>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
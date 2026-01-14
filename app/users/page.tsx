"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UsersTable } from "@/components/users/users-table";
import { Plus, UserCog, Users, Shield } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { Footer } from '@/components/ui/footer';
import { AddUserModal } from "@/components/users/add-user-modal";

type User = {
  id: number;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  // Check if user has permission to manage users
  const canManageUsers = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  if (!canManageUsers) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 pt-20 md:p-8 md:pt-20 lg:p-12 lg:pt-24">
            <div className="mx-auto max-w-7xl animate-fade-in">
              <div className="text-center py-12">
                <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h1 className="text-2xl font-bold text-muted-foreground mb-2">Acceso Denegado</h1>
                <p className="text-muted-foreground">
                  No tienes permisos para acceder a la gestión de usuarios.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/">Volver al Dashboard</Link>
                </Button>
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
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                    Gestión de Usuarios
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Administra usuarios del sistema y sus permisos
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" asChild>
                    <Link href="/">
                      <Users className="mr-2 h-4 w-4" />
                      Ver Dashboard
                    </Link>
                  </Button>
                  {currentUser?.role === 'admin' && (
                    <Button onClick={() => setShowAddModal(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Usuario
                    </Button>
                  )}
                </div>
              </div>

              {/* Main Content */}
              <Card className="card-hover">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50">
                  <CardTitle className="flex items-center gap-2">
                    <div className="rounded-lg bg-indigo-500/10 p-2">
                      <UserCog className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    Todos los Usuarios
                  </CardTitle>
                  <CardDescription>
                    Lista de todos los usuarios en el sistema con sus roles y estado
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <UsersTable currentUser={currentUser} />
                </CardContent>
              </Card>
            </div>
          </div>

          <AddUserModal
            open={showAddModal}
            onOpenChange={setShowAddModal}
            onSuccess={() => window.location.reload()}
          />
        </main>
      </div>
      <Footer />
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
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
import { AddUserModal } from "@/components/users/add-user-modal";
import { useAuthUserStore } from "@/store/auth-user-store";

function canManageUsers(role: string | undefined, membershipRole: string | null) {
  if (role === "platform_admin" || role === "admin" || role === "manager") {
    return true;
  }
  return (
    membershipRole === "tenant_admin" ||
    membershipRole === "manager"
  );
}

function canCreateUsers(role: string | undefined, membershipRole: string | null) {
  if (role === "platform_admin" || role === "admin") return true;
  return membershipRole === "tenant_admin";
}

export default function UsersPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const currentUser = useAuthUserStore((s) => s.user);
  const membershipRole = useAuthUserStore((s) => s.membershipRole);
  const fetchUser = useAuthUserStore((s) => s.fetchUser);
  const isLoading = useAuthUserStore((s) => s.isLoading);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  const allowed = canManageUsers(currentUser?.role, membershipRole);
  const canAdd = canCreateUsers(currentUser?.role, membershipRole);
  const effectiveRole =
    membershipRole ?? currentUser?.role ?? null;

  if (!isLoading && currentUser && !allowed) {
    return (
      <div className="text-center py-12">
        <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h1 className="text-2xl font-bold text-muted-foreground mb-2">
          Acceso Denegado
        </h1>
        <p className="text-muted-foreground">
          No tienes permisos para acceder a la gestión de usuarios.
        </p>
        <Button asChild className="mt-4">
          <Link href="/dashboard">Volver al Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="page-title">Gestión de Usuarios</h1>
            <p className="text-lg text-muted-foreground">
              Usuarios de la organización activa
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <Users className="mr-2 h-4 w-4" />
                Ver Dashboard
              </Link>
            </Button>
            {canAdd && (
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Usuario
              </Button>
            )}
          </div>
        </div>

        <Card className="card-hover">
          <CardHeader className="card-accent-header">
            <CardTitle className="flex items-center gap-2">
              <div className="icon-badge-indigo">
                <UserCog className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              Usuarios de la organización
            </CardTitle>
            <CardDescription>
              Solo se muestran miembros del tenant seleccionado
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <UsersTable
              key={refreshKey}
              currentUser={currentUser}
              effectiveRole={effectiveRole}
            />
          </CardContent>
        </Card>
      </div>

      <AddUserModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResidentsTable } from "@/components/residents/residents-table";
import { Plus, Users, UserPlus } from "lucide-react";
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { Footer } from '@/components/ui/footer';
import { AddResidentModal } from "@/components/residents/add-resident-modal";

export default function ResidentsPage() {
  const [showAddModal, setShowAddModal] = useState(false);

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
                    Gestión de Residentes
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Administra la información y pagos de todos los residentes
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" asChild>
                    <Link href="/">
                      <Users className="mr-2 h-4 w-4" />
                      Ver Dashboard
                    </Link>
                  </Button>
                  <Button onClick={() => setShowAddModal(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Nuevo Residente
                  </Button>
                </div>
              </div>

              {/* Main Content */}
              <Card className="card-hover">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50">
                  <CardTitle className="flex items-center gap-2">
                    <div className="rounded-lg bg-blue-500/10 p-2">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    Todos los Residentes
                  </CardTitle>
                  <CardDescription>
                    Lista completa de residentes con su información de contacto y estado de pagos
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <ResidentsTable />
                </CardContent>
              </Card>
            </div>
          </div>

          <AddResidentModal
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
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
import { TokensTable } from "@/components/tokens/tokens-table";
import { Plus, Key, CreditCard } from "lucide-react";
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { Footer } from '@/components/ui/footer';
import { AddTokenModal } from "@/components/tokens/add-token-modal";

export default function TokensPage() {
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
                    Gestión de Tokens
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Administra todos los tokens de acceso y sus residentes asociados
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" asChild>
                    <Link href="/">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Ver Dashboard
                    </Link>
                  </Button>
                  <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Token
                  </Button>
                </div>
              </div>

              {/* Main Content */}
              <Card className="card-hover">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50">
                  <CardTitle className="flex items-center gap-2">
                    <div className="rounded-lg bg-purple-500/10 p-2">
                      <Key className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    Todos los Tokens
                  </CardTitle>
                  <CardDescription>
                    Lista de todos los tokens con su estado e información de pago
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <TokensTable />
                </CardContent>
              </Card>
            </div>
          </div>

          <AddTokenModal
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
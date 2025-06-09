"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
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
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import Link from "next/link";
import { ResidentForm } from "@/components/ResidentForm";
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { Footer } from '@/components/ui/footer';

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  cedula: z.string().min(8, {
    message: "Cedula must be a valid document number.",
  }),
  phone: z.string().min(10, {
    message: "Phone must be a valid phone number.",
  }),
  address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }),
});

export default function NewResidentPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 pt-20 md:p-8 md:pt-20 lg:p-12 lg:pt-24">
          <div className="mx-auto max-w-7xl animate-fade-in">
            <div className="flex flex-col gap-8">
              {/* Header Section */}
              <div className="flex items-center gap-4">
                <Link href="/residents">
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                    Nuevo Residente
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Agrega un nuevo residente al sistema
                  </p>
                </div>
              </div>

              {/* Main Content */}
              <Card className="card-hover">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50">
                  <CardTitle className="flex items-center gap-2">
                    <div className="rounded-lg bg-blue-500/10 p-2">
                      <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    Información del Residente
                  </CardTitle>
                  <CardDescription>
                    Ingresa los datos del nuevo residente
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <ResidentForm />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
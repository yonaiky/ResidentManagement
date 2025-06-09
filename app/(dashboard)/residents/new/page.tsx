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
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { ResidentForm } from "@/components/ResidentForm";

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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Residente</h1>
        <p className="text-muted-foreground">
          Agrega un nuevo residente al sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Residente</CardTitle>
          <CardDescription>
            Ingresa los datos del nuevo residente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResidentForm />
        </CardContent>
      </Card>
    </div>
  );
}
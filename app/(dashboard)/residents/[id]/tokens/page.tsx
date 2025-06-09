import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResidentTokensTable } from "@/components/residents/resident-tokens-table";
import { Plus, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";

// Configurar la página como dinámica
export const dynamic = "force-dynamic";

async function getResident(id: string) {
  const resident = await prisma.resident.findUnique({
    where: { id: parseInt(id) },
  });
  
  if (!resident) {
    return null;
  }
  
  return resident;
}

export default async function ResidentTokensPage({
  params,
}: {
  params: { id: string };
}) {
  const resident = await getResident(params.id);

  if (!resident) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/residents">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tokens de {resident.name}</h1>
            <p className="text-muted-foreground">
              Gestiona los tokens asociados a este residente
            </p>
          </div>
        </div>
        <Link href={`/residents/${resident.id}/tokens/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Token
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tokens Asignados</CardTitle>
          <CardDescription>
            Lista de todos los tokens asignados a este residente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResidentTokensTable residentId={resident.id} />
        </CardContent>
      </Card>
    </div>
  );
}
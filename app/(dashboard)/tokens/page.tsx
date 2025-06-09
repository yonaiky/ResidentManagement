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
import { Plus } from "lucide-react";

export default function TokensPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tokens</h1>
          <p className="text-muted-foreground">
            Gestiona todos los tokens y sus residentes asociados
          </p>
        </div>
        <Link href="/tokens/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Token
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos los Tokens</CardTitle>
          <CardDescription>
            Lista de todos los tokens con su estado e información de pago
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TokensTable />
        </CardContent>
      </Card>
    </div>
  );
}
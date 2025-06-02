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
            Manage all tokens and their associated residents
          </p>
        </div>
        <Link href="/tokens/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Token
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tokens</CardTitle>
          <CardDescription>
            A list of all tokens with their status and payment information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TokensTable />
        </CardContent>
      </Card>
    </div>
  );
}
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
import { Plus } from "lucide-react";

export default function ResidentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Residents</h1>
          <p className="text-muted-foreground">
            Manage your residents and their information
          </p>
        </div>
        <Link href="/residents/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Resident
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Residents</CardTitle>
          <CardDescription>
            A list of all residents with their information and payment status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResidentsTable />
        </CardContent>
      </Card>
    </div>
  );
}
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PaymentsTable } from "@/components/payments/payments-table";
import { Plus } from "lucide-react";

export default function PaymentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">
            Manage all payment records and transactions
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Payments</CardTitle>
          <CardDescription>
            A complete list of all payment transactions in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentsTable />
        </CardContent>
      </Card>
    </div>
  );
}
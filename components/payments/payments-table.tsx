"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  FileDown,
  MoreHorizontal,
  Printer,
  Search,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

// Dummy data for payments
const paymentData = [
  {
    id: 1,
    amount: 150.0,
    status: "completed",
    paymentDate: new Date("2023-04-05"),
    dueDate: new Date("2023-04-05"),
    residentId: 1,
    residentName: "John Doe",
  },
  {
    id: 2,
    amount: 120.0,
    status: "pending",
    paymentDate: null,
    dueDate: new Date("2023-04-10"),
    residentId: 2,
    residentName: "Jane Smith",
  },
  {
    id: 3,
    amount: 180.0,
    status: "overdue",
    paymentDate: null,
    dueDate: new Date("2023-03-15"),
    residentId: 3,
    residentName: "Robert Johnson",
  },
  {
    id: 4,
    amount: 200.0,
    status: "completed",
    paymentDate: new Date("2023-04-03"),
    dueDate: new Date("2023-04-05"),
    residentId: 4,
    residentName: "Maria Garcia",
  },
  {
    id: 5,
    amount: 150.0,
    status: "pending",
    paymentDate: null,
    dueDate: new Date("2023-04-15"),
    residentId: 5,
    residentName: "James Wilson",
  },
  {
    id: 6,
    amount: 120.0,
    status: "overdue",
    paymentDate: null,
    dueDate: new Date("2023-03-20"),
    residentId: 6,
    residentName: "Patricia Lee",
  },
  {
    id: 7,
    amount: 180.0,
    status: "completed",
    paymentDate: new Date("2023-03-30"),
    dueDate: new Date("2023-04-01"),
    residentId: 7,
    residentName: "Michael Brown",
  },
  {
    id: 8,
    amount: 200.0,
    status: "pending",
    paymentDate: null,
    dueDate: new Date("2023-04-20"),
    residentId: 8,
    residentName: "Elizabeth Davis",
  },
];

export function PaymentsTable() {
  const [payments] = useState(paymentData);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPayments = payments.filter(
    (payment) =>
      payment.residentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search payments..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Resident</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-mono text-xs">#{payment.id}</TableCell>
                <TableCell className="font-medium">${payment.amount.toFixed(2)}</TableCell>
                <TableCell>
                  {payment.status === "completed" ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Completed
                    </Badge>
                  ) : payment.status === "pending" ? (
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                      <Clock className="mr-1 h-3 w-3" />
                      Pending
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      Overdue
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {payment.paymentDate
                    ? format(payment.paymentDate, "MMM dd, yyyy")
                    : "Not paid"}
                </TableCell>
                <TableCell>
                  {format(payment.dueDate, "MMM dd, yyyy")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <Link 
                      href={`/residents/${payment.residentId}`}
                      className="hover:underline"
                    >
                      {payment.residentName}
                    </Link>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/payments/${payment.id}`}>
                          <Eye className="mr-2 h-4 w-4" /> View details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Printer className="mr-2 h-4 w-4" /> Print receipt
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <FileDown className="mr-2 h-4 w-4" /> Export
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
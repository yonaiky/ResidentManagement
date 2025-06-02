"use client";

import { useState } from "react";
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
import { CheckCircle, MoreHorizontal, Printer, FileDown, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const recentPayments = [
  {
    id: 1,
    residentId: 1001,
    residentName: "John Doe",
    amount: 150.0,
    date: new Date("2023-04-10"),
    status: "completed",
  },
  {
    id: 2,
    residentId: 1002,
    residentName: "Jane Smith",
    amount: 120.0,
    date: new Date("2023-04-08"),
    status: "completed",
  },
  {
    id: 3,
    residentId: 1003,
    residentName: "Robert Johnson",
    amount: 180.0,
    date: new Date("2023-04-05"),
    status: "completed",
  },
  {
    id: 4,
    residentId: 1004,
    residentName: "Maria Garcia",
    amount: 200.0,
    date: new Date("2023-04-03"),
    status: "completed",
  },
  {
    id: 5,
    residentId: 1005,
    residentName: "James Wilson",
    amount: 150.0,
    date: new Date("2023-03-30"),
    status: "completed",
  },
  {
    id: 6,
    residentId: 1006,
    residentName: "Patricia Lee",
    amount: 120.0,
    date: new Date("2023-03-28"),
    status: "completed",
  },
  {
    id: 7,
    residentId: 1007,
    residentName: "Michael Brown",
    amount: 180.0,
    date: new Date("2023-03-25"),
    status: "completed",
  },
  {
    id: 8,
    residentId: 1008,
    residentName: "Elizabeth Davis",
    amount: 200.0,
    date: new Date("2023-03-22"),
    status: "completed",
  },
];

export function RecentPayments() {
  const [payments] = useState(recentPayments);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Resident</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-medium">#{payment.id}</TableCell>
              <TableCell>{payment.residentName}</TableCell>
              <TableCell>${payment.amount.toFixed(2)}</TableCell>
              <TableCell>{format(payment.date, "MMM dd, yyyy")}</TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Completed
                </Badge>
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
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" /> View details
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
  );
}
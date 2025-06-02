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
import { 
  AlertCircle, 
  Clock, 
  DollarSign, 
  Eye, 
  FileDown, 
  MoreHorizontal, 
  SendHorizontal 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const pendingPayments = [
  {
    id: 101,
    residentId: 2001,
    residentName: "Thomas Anderson",
    amount: 150.0,
    dueDate: new Date("2023-04-15"),
    status: "pending",
    daysOverdue: 0,
  },
  {
    id: 102,
    residentId: 2002,
    residentName: "Sarah Connor",
    amount: 120.0,
    dueDate: new Date("2023-04-12"),
    status: "pending",
    daysOverdue: 3,
  },
  {
    id: 103,
    residentId: 2003,
    residentName: "Ellen Ripley",
    amount: 180.0,
    dueDate: new Date("2023-04-10"),
    status: "pending",
    daysOverdue: 5,
  },
  {
    id: 104,
    residentId: 2004,
    residentName: "John McClane",
    amount: 200.0,
    dueDate: new Date("2023-04-08"),
    status: "pending",
    daysOverdue: 7,
  },
  {
    id: 105,
    residentId: 2005,
    residentName: "Clarice Starling",
    amount: 150.0,
    dueDate: new Date("2023-04-05"),
    status: "pending",
    daysOverdue: 10,
  },
  {
    id: 106,
    residentId: 2006,
    residentName: "Marty McFly",
    amount: 120.0,
    dueDate: new Date("2023-04-03"),
    status: "pending",
    daysOverdue: 12,
  },
  {
    id: 107,
    residentId: 2007,
    residentName: "Princess Leia",
    amount: 180.0,
    dueDate: new Date("2023-04-01"),
    status: "pending",
    daysOverdue: 14,
  },
  {
    id: 108,
    residentId: 2008,
    residentName: "Indiana Jones",
    amount: 200.0,
    dueDate: new Date("2023-03-30"),
    status: "pending",
    daysOverdue: 16,
  },
];

export function PendingPayments() {
  const [payments] = useState(pendingPayments);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Resident</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Due Date</TableHead>
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
              <TableCell>{format(payment.dueDate, "MMM dd, yyyy")}</TableCell>
              <TableCell>
                <Badge 
                  variant="outline" 
                  className={
                    payment.daysOverdue > 7 
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" 
                      : payment.daysOverdue > 0
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                  }
                >
                  {payment.daysOverdue > 7 ? (
                    <AlertCircle className="mr-1 h-3 w-3" />
                  ) : payment.daysOverdue > 0 ? (
                    <Clock className="mr-1 h-3 w-3" />
                  ) : (
                    <Clock className="mr-1 h-3 w-3" />
                  )}
                  {payment.daysOverdue > 0
                    ? `Overdue by ${payment.daysOverdue} days`
                    : "Due Soon"}
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
                      <DollarSign className="mr-2 h-4 w-4" /> Record Payment
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <SendHorizontal className="mr-2 h-4 w-4" /> Send Reminder
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" /> View details
                    </DropdownMenuItem>
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
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
  DollarSign,
  Edit,
  Eye,
  MoreHorizontal,
  PowerOff,
  Search,
  Trash2,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

// Dummy data for tokens
const tokenData = [
  {
    id: 1,
    name: "Home Access",
    status: "active",
    paymentStatus: "paid",
    lastPaymentDate: new Date("2023-04-05"),
    nextPaymentDate: new Date("2023-05-05"),
    residentId: 1,
    residentName: "John Doe",
  },
  {
    id: 2,
    name: "Office Access",
    status: "active",
    paymentStatus: "pending",
    lastPaymentDate: new Date("2023-03-05"),
    nextPaymentDate: new Date("2023-04-05"),
    residentId: 1,
    residentName: "John Doe",
  },
  {
    id: 3,
    name: "Gym Access",
    status: "inactive",
    paymentStatus: "overdue",
    lastPaymentDate: new Date("2023-02-05"),
    nextPaymentDate: new Date("2023-03-05"),
    residentId: 2,
    residentName: "Jane Smith",
  },
  {
    id: 4,
    name: "Parking Access",
    status: "active",
    paymentStatus: "paid",
    lastPaymentDate: new Date("2023-04-10"),
    nextPaymentDate: new Date("2023-05-10"),
    residentId: 3,
    residentName: "Robert Johnson",
  },
  {
    id: 5,
    name: "Pool Access",
    status: "active",
    paymentStatus: "pending",
    lastPaymentDate: new Date("2023-03-15"),
    nextPaymentDate: new Date("2023-04-15"),
    residentId: 3,
    residentName: "Robert Johnson",
  },
  {
    id: 6,
    name: "Club Access",
    status: "inactive",
    paymentStatus: "overdue",
    lastPaymentDate: new Date("2023-01-20"),
    nextPaymentDate: new Date("2023-02-20"),
    residentId: 3,
    residentName: "Robert Johnson",
  },
  {
    id: 7,
    name: "Main Gate",
    status: "active",
    paymentStatus: "paid",
    lastPaymentDate: new Date("2023-04-25"),
    nextPaymentDate: new Date("2023-05-25"),
    residentId: 4,
    residentName: "Maria Garcia",
  },
  {
    id: 8,
    name: "Back Gate",
    status: "active",
    paymentStatus: "pending",
    lastPaymentDate: new Date("2023-03-30"),
    nextPaymentDate: new Date("2023-04-30"),
    residentId: 5,
    residentName: "James Wilson",
  },
];

export function TokensTable() {
  const [tokens] = useState(tokenData);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTokens = tokens.filter(
    (token) =>
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.residentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tokens or residents..."
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
              <TableHead>Token Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Next Payment</TableHead>
              <TableHead>Resident</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTokens.map((token) => (
              <TableRow key={token.id}>
                <TableCell className="font-mono text-xs">#{token.id}</TableCell>
                <TableCell className="font-medium">{token.name}</TableCell>
                <TableCell>
                  {token.status === "active" ? (
                    <Badge variant="outline\" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                      <PowerOff className="mr-1 h-3 w-3" />
                      Inactive
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {token.paymentStatus === "paid" ? (
                    <Badge variant="outline\" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Paid
                    </Badge>
                  ) : token.paymentStatus === "pending" ? (
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
                  {token.nextPaymentDate
                    ? format(token.nextPaymentDate, "MMM dd, yyyy")
                    : "N/A"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <Link 
                      href={`/residents/${token.residentId}`}
                      className="hover:underline"
                    >
                      {token.residentName}
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
                        <Link href={`/tokens/${token.id}`}>
                          <Eye className="mr-2 h-4 w-4" /> View details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/tokens/${token.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <DollarSign className="mr-2 h-4 w-4" /> Record payment
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        {token.status === "active" ? (
                          <>
                            <PowerOff className="mr-2 h-4 w-4" /> Deactivate
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" /> Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
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
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
  CreditCard,
  Edit,
  Eye,
  MoreHorizontal,
  Search,
  Trash2,
  UserCog,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

// Dummy data for residents
const residentData = [
  {
    id: 1,
    name: "John Doe",
    cedula: "V-12345678",
    phone: "+58 412-1234567",
    address: "Calle Principal #123, Caracas",
    paymentStatus: "paid",
    lastPaymentDate: new Date("2023-04-05"),
    nextPaymentDate: new Date("2023-05-05"),
    tokensCount: 2,
  },
  {
    id: 2,
    name: "Jane Smith",
    cedula: "V-87654321",
    phone: "+58 414-7654321",
    address: "Avenida Libertador #456, Caracas",
    paymentStatus: "pending",
    lastPaymentDate: new Date("2023-03-05"),
    nextPaymentDate: new Date("2023-04-05"),
    tokensCount: 1,
  },
  {
    id: 3,
    name: "Robert Johnson",
    cedula: "V-23456789",
    phone: "+58 416-2345678",
    address: "Calle Bolívar #789, Maracaibo",
    paymentStatus: "overdue",
    lastPaymentDate: new Date("2023-02-05"),
    nextPaymentDate: new Date("2023-03-05"),
    tokensCount: 3,
  },
  {
    id: 4,
    name: "Maria Garcia",
    cedula: "V-34567890",
    phone: "+58 424-3456789",
    address: "Avenida Las Mercedes #101, Valencia",
    paymentStatus: "paid",
    lastPaymentDate: new Date("2023-04-10"),
    nextPaymentDate: new Date("2023-05-10"),
    tokensCount: 1,
  },
  {
    id: 5,
    name: "James Wilson",
    cedula: "V-45678901",
    phone: "+58 412-4567890",
    address: "Calle La Pastora #202, Barquisimeto",
    paymentStatus: "pending",
    lastPaymentDate: new Date("2023-03-15"),
    nextPaymentDate: new Date("2023-04-15"),
    tokensCount: 2,
  },
  {
    id: 6,
    name: "Patricia Lee",
    cedula: "V-56789012",
    phone: "+58 414-5678901",
    address: "Avenida 5 de Julio #303, Maracaibo",
    paymentStatus: "overdue",
    lastPaymentDate: new Date("2023-01-20"),
    nextPaymentDate: new Date("2023-02-20"),
    tokensCount: 1,
  },
  {
    id: 7,
    name: "Michael Brown",
    cedula: "V-67890123",
    phone: "+58 416-6789012",
    address: "Calle Sucre #404, Ciudad Bolívar",
    paymentStatus: "paid",
    lastPaymentDate: new Date("2023-04-25"),
    nextPaymentDate: new Date("2023-05-25"),
    tokensCount: 2,
  },
  {
    id: 8,
    name: "Elizabeth Davis",
    cedula: "V-78901234",
    phone: "+58 424-7890123",
    address: "Avenida Principal #505, Mérida",
    paymentStatus: "pending",
    lastPaymentDate: new Date("2023-03-30"),
    nextPaymentDate: new Date("2023-04-30"),
    tokensCount: 1,
  },
];

export function ResidentsTable() {
  const [residents] = useState(residentData);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredResidents = residents.filter(
    (resident) =>
      resident.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.cedula.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search residents..."
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
              <TableHead>Name</TableHead>
              <TableHead>Cedula</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Next Payment</TableHead>
              <TableHead>Tokens</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResidents.map((resident) => (
              <TableRow key={resident.id}>
                <TableCell className="font-medium">{resident.name}</TableCell>
                <TableCell>{resident.cedula}</TableCell>
                <TableCell>{resident.phone}</TableCell>
                <TableCell>
                  {resident.paymentStatus === "paid" ? (
                    <Badge variant="outline\" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Paid
                    </Badge>
                  ) : resident.paymentStatus === "pending" ? (
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
                  {resident.nextPaymentDate
                    ? format(resident.nextPaymentDate, "MMM dd, yyyy")
                    : "N/A"}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-mono">
                    {resident.tokensCount}
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
                      <DropdownMenuItem asChild>
                        <Link href={`/residents/${resident.id}`}>
                          <Eye className="mr-2 h-4 w-4" /> View details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/residents/${resident.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/residents/${resident.id}/tokens`}>
                          <CreditCard className="mr-2 h-4 w-4" /> Manage tokens
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/residents/${resident.id}/payments`}>
                          <UserCog className="mr-2 h-4 w-4" /> Payment history
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
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
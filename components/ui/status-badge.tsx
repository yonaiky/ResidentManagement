import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

type StatusBadgeProps = {
  status: "active" | "inactive" | "paid" | "pending" | "overdue";
};

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "active":
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          <CheckCircle className="mr-1 h-3 w-3" />
          Activo
        </Badge>
      );
    case "inactive":
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
          <XCircle className="mr-1 h-3 w-3" />
          Inactivo
        </Badge>
      );
    case "paid":
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          <CheckCircle className="mr-1 h-3 w-3" />
          Pagado
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
          <Clock className="mr-1 h-3 w-3" />
          Pendiente
        </Badge>
      );
    case "overdue":
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
          <AlertCircle className="mr-1 h-3 w-3" />
          Vencido
        </Badge>
      );
  }
} 
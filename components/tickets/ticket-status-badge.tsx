import { Badge } from "@/components/ui/badge";
import { getStatusColor, getStatusLabel } from "@/lib/tickets/constants";
import { cn } from "@/lib/utils";

export function TicketStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="secondary" className={cn("font-medium", getStatusColor(status))}>
      {getStatusLabel(status)}
    </Badge>
  );
}

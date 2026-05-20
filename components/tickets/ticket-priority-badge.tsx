import { Badge } from "@/components/ui/badge";
import { getPriorityColor, getPriorityLabel } from "@/lib/tickets/constants";
import { cn } from "@/lib/utils";

export function TicketPriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", getPriorityColor(priority))}>
      {getPriorityLabel(priority)}
    </Badge>
  );
}

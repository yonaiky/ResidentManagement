import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import type { SlaDisplayStatus } from "@/lib/tickets/sla";
import { cn } from "@/lib/utils";

const SLA_STYLES: Record<SlaDisplayStatus, string> = {
  ok: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  breached: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  none: "bg-muted text-muted-foreground",
};

export function TicketSlaBadge({
  slaStatus,
  slaDueAt,
  slaBreached,
}: {
  slaStatus: SlaDisplayStatus;
  slaDueAt: string | null;
  slaBreached: boolean;
}) {
  if (slaStatus === "none" || !slaDueAt) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const Icon =
    slaStatus === "breached" || slaBreached
      ? AlertTriangle
      : slaStatus === "warning"
        ? Clock
        : CheckCircle;

  const label =
    slaStatus === "breached" || slaBreached
      ? "SLA vencido"
      : `Vence ${format(new Date(slaDueAt), "dd MMM HH:mm", { locale: es })}`;

  return (
    <Badge variant="secondary" className={cn("gap-1 font-medium", SLA_STYLES[slaStatus])}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

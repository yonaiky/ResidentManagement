import { Badge } from "@/components/ui/badge";
import { AVAILABILITY_LABELS, type ComputedAvailability } from "@/lib/parking/constants";
import { cn } from "@/lib/utils";

const variants: Record<ComputedAvailability, string> = {
  available: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  occupied: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  maintenance: "bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30",
  reserved: "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30",
};

export function AvailabilityBadge({
  availability,
  className,
}: {
  availability: ComputedAvailability | string;
  className?: string;
}) {
  const key = availability as ComputedAvailability;
  const label = AVAILABILITY_LABELS[key] ?? availability;
  return (
    <Badge variant="outline" className={cn(variants[key] ?? "", className)}>
      {label}
    </Badge>
  );
}

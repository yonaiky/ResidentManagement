"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Hash,
  IdCard,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Resident } from "./types";

type ResidentStatus = "current" | "pending" | "overdue";

type ResidentInfoCardProps = {
  resident: Resident;
  status: ResidentStatus;
};

const statusConfig: Record<
  ResidentStatus,
  { label: string; className: string }
> = {
  current: {
    label: "Al día",
    className:
      "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300",
  },
  pending: {
    label: "Pendiente",
    className:
      "bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300",
  },
  overdue: {
    label: "Moroso",
    className:
      "bg-red-500/15 text-red-700 ring-red-500/30 dark:text-red-300",
  },
};

function getInitials(name: string, lastName: string) {
  return `${name[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

function InfoField({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof User;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            "mt-0.5 truncate text-sm font-medium text-foreground",
            mono && "font-mono"
          )}
        >
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function ResidentInfoCardComponent({ resident, status }: ResidentInfoCardProps) {
  const badge = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="rounded-2xl border border-border bg-muted/40 p-5"
    >
      <div className="mb-5 flex items-center gap-4">
        <motion.div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 text-lg font-semibold text-foreground ring-1 ring-border"
          whileHover={{ scale: 1.02 }}
        >
          {getInitials(resident.name, resident.lastName)}
        </motion.div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-foreground">
            {resident.name} {resident.lastName}
          </p>
          <p className="text-sm text-muted-foreground">Cliente residencial</p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
            badge.className
          )}
        >
          <BadgeCheck className="h-3 w-3" />
          {badge.label}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InfoField icon={IdCard} label="Cédula / RNC" value={resident.cedula} mono />
        <InfoField icon={Hash} label="No. registro" value={resident.noRegistro} mono />
        <InfoField icon={Phone} label="Teléfono" value={resident.phone} />
        <InfoField icon={MapPin} label="Dirección" value={resident.address} />
      </div>
    </motion.div>
  );
}

export const ResidentInfoCard = memo(ResidentInfoCardComponent);

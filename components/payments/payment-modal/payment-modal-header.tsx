"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { CreditCard, X } from "lucide-react";
import { cn } from "@/lib/utils";

type PaymentModalHeaderProps = {
  residentName: string;
  subtitle?: string;
  onClose: () => void;
  className?: string;
};

function PaymentModalHeaderComponent({
  residentName,
  subtitle = "Facturación y cobros",
  onClose,
  className,
}: PaymentModalHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-start justify-between gap-4 border-b border-border px-6 py-5",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-violet-600 shadow-lg shadow-blue-500/20">
          <CreditCard className="h-5 w-5 text-white" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Gestión de pagos
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {residentName}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          "border border-border bg-muted/50 text-muted-foreground",
          "transition-colors hover:bg-muted hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export const PaymentModalHeader = memo(PaymentModalHeaderComponent);

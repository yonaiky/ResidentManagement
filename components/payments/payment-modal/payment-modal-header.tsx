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
        "flex items-start justify-between gap-4 border-b border-white/[0.06] px-6 py-5",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#7C3AED] shadow-lg shadow-blue-500/25">
          <CreditCard className="h-5 w-5 text-white" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-100">
            Gestión de pagos
          </h2>
          <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>
          <p className="mt-1 text-xs font-medium text-slate-500">{residentName}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          "border border-white/[0.08] bg-white/[0.04] text-slate-400",
          "transition-colors hover:bg-white/[0.08] hover:text-slate-100",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
        )}
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export const PaymentModalHeader = memo(PaymentModalHeaderComponent);

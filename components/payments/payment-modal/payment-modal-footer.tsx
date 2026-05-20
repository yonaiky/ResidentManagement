"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PaymentModalFooterProps = {
  selectedCount: number;
  subtotal: number;
  itbis: number;
  total: number;
  loading: boolean;
  disabled: boolean;
  onSubmit: () => void;
  onCancel: () => void;
};

function formatMoney(value: number) {
  return value.toLocaleString("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function PaymentModalFooterComponent({
  selectedCount,
  subtotal,
  itbis,
  total,
  loading,
  disabled,
  onSubmit,
  onCancel,
}: PaymentModalFooterProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "sticky bottom-0 z-10 border-t border-white/[0.08]",
        "bg-[#0f172a]/95 px-6 py-4 backdrop-blur-xl"
      )}
    >
      <AnimatePresence mode="wait">
        {selectedCount > 0 ? (
          <motion.div
            key="summary"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 space-y-2"
          >
            <div className="flex justify-between text-sm text-slate-400">
              <span>
                Subtotal ({selectedCount} período{selectedCount !== 1 ? "s" : ""})
              </span>
              <span className="tabular-nums">${formatMoney(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-400">
              <span>ITBIS (18%)</span>
              <span className="tabular-nums">${formatMoney(itbis)}</span>
            </div>
            <div className="flex justify-between border-t border-white/[0.06] pt-2">
              <span className="text-sm font-medium text-slate-300">Total</span>
              <span className="font-[family-name:var(--font-jakarta)] text-2xl font-bold tabular-nums text-white">
                ${formatMoney(total)}
                <span className="ml-1 text-xs font-normal text-slate-500">DOP</span>
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-4 text-center text-sm text-slate-500"
          >
            Selecciona al menos un período para continuar
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={loading}
          className="h-12 flex-1 rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white"
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={disabled || loading}
          className={cn(
            "group relative h-12 flex-[2] overflow-hidden rounded-xl font-semibold text-white",
            "bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#7C3AED]",
            "shadow-lg shadow-blue-500/25 transition-all",
            "hover:shadow-xl hover:shadow-blue-500/35",
            "disabled:opacity-50 disabled:shadow-none"
          )}
        >
          <span className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/10 to-cyan-400/0 opacity-0 transition-opacity group-hover:opacity-100" />
          <span className="relative flex items-center justify-center gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Procesando…
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Generar factura DGI
                <Sparkles className="h-3.5 w-3.5 text-cyan-200" />
              </>
            )}
          </span>
        </Button>
      </div>
    </motion.div>
  );
}

export const PaymentModalFooter = memo(PaymentModalFooterComponent);

"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { DollarSign, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CustomAmountInputProps = {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
  error?: boolean;
};

function CustomAmountInputComponent({
  value,
  onChange,
  onAdd,
  error,
}: CustomAmountInputProps) {
  const isValid = value !== "" && parseFloat(value) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl border border-border bg-muted/30 p-4"
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Monto personalizado
      </p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm font-medium">DOP</span>
          </div>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && isValid && onAdd()}
            className={cn(
              "h-12 w-full rounded-xl border bg-background pl-[4.5rem] pr-4 text-sm font-medium text-foreground",
              "placeholder:text-muted-foreground/60 outline-none transition-all",
              "focus:border-primary/50 focus:ring-2 focus:ring-ring/30",
              error && !isValid && value !== ""
                ? "border-destructive"
                : "border-input"
            )}
            aria-label="Monto personalizado en pesos dominicanos"
          />
        </div>
        <Button
          type="button"
          onClick={onAdd}
          disabled={!isValid}
          variant="outline"
          className="h-12 shrink-0 rounded-xl px-4"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Agrega un cobro adicional fuera del ciclo mensual estándar
      </p>
    </motion.div>
  );
}

export const CustomAmountInput = memo(CustomAmountInputComponent);

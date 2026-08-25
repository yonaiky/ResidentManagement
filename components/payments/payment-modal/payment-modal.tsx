"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PaymentModalHeader } from "./payment-modal-header";
import { SegmentedTabs } from "./segmented-tabs";
import { ResidentInfoCard } from "./resident-info-card";
import { PeriodSelector } from "./period-selector";
import { CustomAmountInput } from "./custom-amount-input";
import { PaymentModalFooter } from "./payment-modal-footer";
import { PaymentHistoryTab } from "./payment-history-tab";
import { usePaymentForm } from "./use-payment-form";
import type { Resident } from "./types";

type PaymentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resident: Resident | null;
  onSuccess: () => void;
};

function PaymentModalComponent({
  open,
  onOpenChange,
  resident,
  onSuccess,
}: PaymentModalProps) {
  if (!resident) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[min(92vh,900px)] max-w-3xl gap-0 overflow-hidden p-0",
          "border-0 bg-transparent shadow-none",
          "[&>button]:hidden"
        )}
        aria-describedby={undefined}
      >
        <PaymentModalContent
          resident={resident}
          onClose={() => onOpenChange(false)}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}

type PaymentModalContentProps = {
  resident: Resident;
  onClose: () => void;
  onSuccess: () => void;
};

export function PaymentModalContent({
  resident,
  onClose,
  onSuccess,
}: PaymentModalContentProps) {
  const form = usePaymentForm(resident, onSuccess, onClose);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 8 }}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      className={cn(
        "relative flex max-h-[min(92vh,900px)] flex-col overflow-hidden rounded-2xl",
        "border border-border bg-card text-card-foreground shadow-2xl"
      )}
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl dark:bg-violet-500/15" />

      <PaymentModalHeader
        residentName={`${resident.name} ${resident.lastName}`}
        onClose={onClose}
      />

      <div className="relative flex-1 overflow-y-auto px-6 py-5">
        <div className="mb-5">
          <SegmentedTabs
            value={form.activeTab}
            onChange={form.setActiveTab}
          />
        </div>

        <AnimatePresence mode="wait">
          {form.activeTab === "payment" ? (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <ResidentInfoCard
                resident={resident}
                status={form.residentStatus}
              />

              <PeriodSelector
                periods={form.availablePeriods}
                selectedCount={form.selectedPeriods.length}
                isSelected={form.isSelected}
                onToggle={form.togglePeriod}
                onSelectAll={form.selectAllAvailable}
                onClear={form.clearSelection}
              />

              <CustomAmountInput
                value={form.customAmount}
                onChange={form.setCustomAmount}
                onAdd={form.addCustomPeriod}
                error={!!form.error}
              />

              {form.error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="alert"
                  className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {form.error}
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="status"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
            >
              <p className="mb-4 text-sm text-muted-foreground">
                Historial de períodos pagados
              </p>
              <PaymentHistoryTab history={form.paymentHistory} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {form.activeTab === "payment" && (
        <PaymentModalFooter
          selectedCount={form.selectedPeriods.length}
          subtotal={form.subtotal}
          itbis={form.itbis}
          total={form.total}
          loading={form.loading}
          disabled={form.selectedPeriods.length === 0}
          onSubmit={form.handleSubmit}
          onCancel={onClose}
        />
      )}
    </motion.div>
  );
}

export const PaymentModal = memo(PaymentModalComponent);

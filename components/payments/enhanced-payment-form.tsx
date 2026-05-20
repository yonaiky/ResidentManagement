"use client";

import { PaymentModalContent } from "./payment-modal/payment-modal";
import type { Resident } from "./payment-modal/types";

interface EnhancedPaymentFormProps {
  resident: Resident;
  onSuccess: () => void;
  onClose: () => void;
}

/** Contenido del modal premium (sin Dialog). */
export function EnhancedPaymentForm({
  resident,
  onSuccess,
  onClose,
}: EnhancedPaymentFormProps) {
  return (
    <PaymentModalContent
      resident={resident}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

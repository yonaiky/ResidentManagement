"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, isAfter } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import { DGIInvoiceGenerator, DEFAULT_COMPANY_INFO, type InvoiceData } from "@/lib/invoice-generator";
import {
  type BillingPeriod,
  type PaymentModalTab,
  type Resident,
  ITBIS_RATE,
  MONTHLY_AMOUNT,
} from "./types";

function periodKey(p: BillingPeriod) {
  return `${p.year}-${p.month}`;
}

export function usePaymentForm(
  resident: Resident,
  onSuccess: () => void,
  onClose: () => void
) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriods, setSelectedPeriods] = useState<BillingPeriod[]>([]);
  const [availablePeriods, setAvailablePeriods] = useState<BillingPeriod[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<BillingPeriod[]>([]);
  const [customAmount, setCustomAmount] = useState("");
  const [activeTab, setActiveTab] = useState<PaymentModalTab>("payment");

  const generatePaymentStatus = useCallback(
    (existingPayments: { month: number; year: number }[]) => {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const registrationDate = new Date(resident.createdAt);
      const registrationMonth = registrationDate.getMonth();
      const registrationYear = registrationDate.getFullYear();

      const history: BillingPeriod[] = [];
      const available: BillingPeriod[] = [];

      let currentDate = new Date(registrationYear, registrationMonth, 1);
      const endDate = new Date(currentYear, currentMonth + 6, 1);

      while (currentDate <= endDate) {
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        const dueDate = new Date(year, currentDate.getMonth(), 30);

        const existingPayment = existingPayments.find(
          (p) => p.month === month && p.year === year
        );
        const status = existingPayment
          ? "paid"
          : isAfter(today, dueDate)
            ? "overdue"
            : "pending";

        const period: BillingPeriod = {
          month,
          year,
          amount: MONTHLY_AMOUNT,
          status,
          dueDate,
          daysOverdue:
            status === "overdue"
              ? Math.floor(
                  (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
                )
              : undefined,
          daysRemaining:
            status === "pending"
              ? Math.floor(
                  (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                )
              : undefined,
        };

        if (status === "paid") history.push(period);
        else available.push(period);

        currentDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          1
        );
      }

      setPaymentHistory(history);
      setAvailablePeriods(available);
    },
    [resident.createdAt]
  );

  const loadPaymentData = useCallback(async () => {
    try {
      const response = await fetch(`/api/residents/${resident.id}/payments`);
      if (response.ok) {
        const payments = await response.json();
        generatePaymentStatus(payments);
      } else {
        generatePaymentStatus([]);
      }
    } catch {
      generatePaymentStatus([]);
    }
  }, [resident.id, generatePaymentStatus]);

  useEffect(() => {
    void loadPaymentData();
    setSelectedPeriods([]);
    setError(null);
    setActiveTab("payment");
  }, [resident.id, loadPaymentData]);

  const isSelected = useCallback(
    (period: BillingPeriod) =>
      selectedPeriods.some(
        (p) => p.month === period.month && p.year === period.year
      ),
    [selectedPeriods]
  );

  const togglePeriod = useCallback((period: BillingPeriod) => {
    setSelectedPeriods((prev) => {
      const exists = prev.find(
        (p) => p.month === period.month && p.year === period.year
      );
      if (exists) {
        return prev.filter(
          (p) => !(p.month === period.month && p.year === period.year)
        );
      }
      return [...prev, period];
    });
    setError(null);
  }, []);

  const selectAllAvailable = useCallback(() => {
    setSelectedPeriods([...availablePeriods]);
    setError(null);
  }, [availablePeriods]);

  const clearSelection = useCallback(() => {
    setSelectedPeriods([]);
  }, []);

  const removePeriod = useCallback((period: BillingPeriod) => {
    setSelectedPeriods((prev) =>
      prev.filter(
        (p) => !(p.month === period.month && p.year === period.year)
      )
    );
  }, []);

  const addCustomPeriod = useCallback(() => {
    const amount = parseFloat(customAmount);
    if (!customAmount || amount <= 0) {
      setError("Ingrese un monto válido");
      return;
    }

    const today = new Date();
    const custom: BillingPeriod = {
      month: today.getMonth() + 1,
      year: today.getFullYear(),
      amount,
      status: "pending",
      dueDate: new Date(today.getFullYear(), today.getMonth(), 30),
    };

    setSelectedPeriods((prev) => [...prev, custom]);
    setCustomAmount("");
    setError(null);
  }, [customAmount]);

  const subtotal = useMemo(
    () => selectedPeriods.reduce((t, p) => t + p.amount, 0),
    [selectedPeriods]
  );

  const itbis = useMemo(() => subtotal * ITBIS_RATE, [subtotal]);
  const total = useMemo(() => subtotal + itbis, [subtotal, itbis]);

  const overdueCount = useMemo(
    () => availablePeriods.filter((p) => p.status === "overdue").length,
    [availablePeriods]
  );

  const residentStatus = useMemo(() => {
    if (overdueCount > 0) return "overdue" as const;
    if (availablePeriods.some((p) => p.status === "pending")) return "pending" as const;
    return "current" as const;
  }, [overdueCount, availablePeriods]);

  const handleSubmit = useCallback(async () => {
    if (selectedPeriods.length === 0) {
      setError("Seleccione al menos un período para facturar");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      for (const period of selectedPeriods) {
        const response = await fetch(`/api/residents/${resident.id}/payments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            amount: period.amount,
            month: period.month,
            year: period.year,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Error al registrar el pago");
        }
      }

      const invoiceGenerator = new DGIInvoiceGenerator(DEFAULT_COMPANY_INFO);
      const invoiceData: InvoiceData = {
        resident,
        payments: selectedPeriods,
        invoiceNumber: DGIInvoiceGenerator.generateInvoiceNumber(),
        ncf: DGIInvoiceGenerator.generateNCF(),
        issueDate: new Date(),
      };
      const invoice = invoiceGenerator.generateInvoice(invoiceData);
      const pdfDataUrl = invoice.output("dataurlstring");

      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>Factura DGI</title></head>
            <body style="margin:0">
              <iframe src="${pdfDataUrl}" style="width:100%;height:100vh;border:0"></iframe>
            </body>
          </html>
        `);
      }

      toast({
        title: "Pago registrado",
        description: `${selectedPeriods.length} período(s) · $${total.toFixed(2)} DOP`,
      });

      onSuccess();
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudieron registrar los pagos";
      setError(message);
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [selectedPeriods, resident, total, toast, onSuccess, onClose]);

  const formatPeriodLabel = useCallback((period: BillingPeriod) => {
    return format(new Date(period.year, period.month - 1), "MMMM yyyy", {
      locale: es,
    });
  }, []);

  return {
    loading,
    error,
    activeTab,
    setActiveTab,
    selectedPeriods,
    availablePeriods,
    paymentHistory,
    customAmount,
    setCustomAmount,
    subtotal,
    itbis,
    total,
    overdueCount,
    residentStatus,
    isSelected,
    togglePeriod,
    selectAllAvailable,
    clearSelection,
    removePeriod,
    addCustomPeriod,
    handleSubmit,
    formatPeriodLabel,
    periodKey,
  };
}

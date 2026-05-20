export type Resident = {
  id: number;
  name: string;
  lastName: string;
  cedula: string;
  noRegistro: string;
  phone: string;
  address: string;
  createdAt: string;
};

export type PeriodStatus = "paid" | "pending" | "overdue";

export type BillingPeriod = {
  month: number;
  year: number;
  amount: number;
  status: PeriodStatus;
  dueDate: Date;
  daysOverdue?: number;
  daysRemaining?: number;
};

export type PaymentModalTab = "payment" | "status";

export const MONTHLY_AMOUNT = 700;
export const ITBIS_RATE = 0.18;

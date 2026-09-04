/** Money helpers — amounts stored as Decimal(18,2), exposed as number in APIs. */

import { Prisma } from "@prisma/client";

export type Money = Prisma.Decimal;

export function money(value: number | string | Prisma.Decimal): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

export function moneyToNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number") return Math.round(value * 100) / 100;
  return Math.round(Number(value) * 100) / 100;
}

export function moneyAdd(a: Prisma.Decimal | number, b: Prisma.Decimal | number): Prisma.Decimal {
  return money(a).plus(money(b));
}

export function moneySub(a: Prisma.Decimal | number, b: Prisma.Decimal | number): Prisma.Decimal {
  return money(a).minus(money(b));
}

export function moneyMin(a: Prisma.Decimal | number, b: Prisma.Decimal | number): Prisma.Decimal {
  const da = money(a);
  const db = money(b);
  return da.lessThan(db) ? da : db;
}

export function moneyIsPositive(a: Prisma.Decimal | number): boolean {
  return money(a).greaterThan(0);
}

export function moneyGte(a: Prisma.Decimal | number, b: Prisma.Decimal | number): boolean {
  return money(a).greaterThanOrEqualTo(money(b));
}

export const CHARGE_STATUS = {
  PENDING: "PENDING",
  PARTIAL: "PARTIAL",
  PAID: "PAID",
  OVERDUE: "OVERDUE",
  CANCELLED: "CANCELLED",
} as const;

export const PAYMENT_STATUS = {
  CONFIRMED: "CONFIRMED",
  VOID: "VOID",
  /** Legacy */
  completed: "completed",
  pending: "pending",
  overdue: "overdue",
} as const;

export const RECEIPT_STATUS = {
  ISSUED: "ISSUED",
  VOID: "VOID",
} as const;

export const FEE_RECURRENCE = {
  once: "once",
  monthly: "monthly",
} as const;

export function deriveChargeStatus(
  outstanding: Prisma.Decimal | number,
  amount: Prisma.Decimal | number,
  dueDate: Date,
  now = new Date()
): string {
  const out = money(outstanding);
  if (out.lessThanOrEqualTo(0)) return CHARGE_STATUS.PAID;
  if (out.lessThan(money(amount))) {
    return dueDate < now ? CHARGE_STATUS.OVERDUE : CHARGE_STATUS.PARTIAL;
  }
  return dueDate < now ? CHARGE_STATUS.OVERDUE : CHARGE_STATUS.PENDING;
}

export function arrearsBucket(daysOverdue: number): "1-30" | "31-60" | "61-90" | "90+" {
  if (daysOverdue <= 30) return "1-30";
  if (daysOverdue <= 60) return "31-60";
  if (daysOverdue <= 90) return "61-90";
  return "90+";
}

export function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

import { describe, it, expect } from "vitest";
import {
  deriveChargeStatus,
  money,
  moneyMin,
  moneySub,
  moneyToNumber,
  arrearsBucket,
  CHARGE_STATUS,
} from "@/lib/finance/money";

describe("money helpers", () => {
  it("rounds to 2 decimals", () => {
    expect(moneyToNumber(money("10.555"))).toBe(10.56);
  });

  it("moneyMin works", () => {
    expect(moneyToNumber(moneyMin(100, 40))).toBe(40);
  });

  it("moneySub works", () => {
    expect(moneyToNumber(moneySub(3500, 2000))).toBe(1500);
  });
});

describe("deriveChargeStatus", () => {
  const dueFuture = new Date(Date.now() + 86400000 * 10);
  const duePast = new Date(Date.now() - 86400000 * 10);

  it("PAID when outstanding 0", () => {
    expect(deriveChargeStatus(0, 3500, dueFuture)).toBe(CHARGE_STATUS.PAID);
  });

  it("PARTIAL when partially paid and not overdue", () => {
    expect(deriveChargeStatus(1500, 3500, dueFuture)).toBe(CHARGE_STATUS.PARTIAL);
  });

  it("OVERDUE when full outstanding and past due", () => {
    expect(deriveChargeStatus(3500, 3500, duePast)).toBe(CHARGE_STATUS.OVERDUE);
  });

  it("PENDING when full outstanding and future due", () => {
    expect(deriveChargeStatus(3500, 3500, dueFuture)).toBe(CHARGE_STATUS.PENDING);
  });
});

describe("arrearsBucket", () => {
  it("classifies ranges", () => {
    expect(arrearsBucket(5)).toBe("1-30");
    expect(arrearsBucket(45)).toBe("31-60");
    expect(arrearsBucket(75)).toBe("61-90");
    expect(arrearsBucket(120)).toBe("90+");
  });
});

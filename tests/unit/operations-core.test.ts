import { describe, it, expect } from "vitest";
import {
  generateAccessCode,
  isAccessCodeValid,
} from "@/lib/operations/access-code";
import {
  durationMinutes,
  isWithinAreaHours,
  parseTimeToMinutes,
} from "@/lib/reservations/overlap";
import { canTransition } from "@/lib/tickets/status";

describe("access code", () => {
  it("generates non-sequential hex tokens", () => {
    const a = generateAccessCode();
    const b = generateAccessCode();
    expect(a).toHaveLength(16);
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[0-9A-F]+$/);
  });

  it("rejects expired codes", () => {
    const ok = isAccessCodeValid({
      code: "ABCD",
      expected: "ABCD",
      expiresAt: new Date(Date.now() - 1000),
    });
    expect(ok).toBe(false);
  });

  it("accepts valid codes", () => {
    const ok = isAccessCodeValid({
      code: "abcd",
      expected: "ABCD",
      expiresAt: new Date(Date.now() + 60_000),
    });
    expect(ok).toBe(true);
  });
});

describe("reservation hours", () => {
  it("parses HH:mm", () => {
    expect(parseTimeToMinutes("08:00")).toBe(480);
    expect(parseTimeToMinutes("22:30")).toBe(1350);
  });

  it("validates area window same day", () => {
    const start = new Date("2026-06-01T10:00:00");
    const end = new Date("2026-06-01T12:00:00");
    expect(isWithinAreaHours(start, end, "08:00", "22:00")).toBe(true);
    expect(isWithinAreaHours(start, end, "11:00", "22:00")).toBe(false);
    expect(durationMinutes(start, end)).toBe(120);
  });
});

describe("ticket transitions", () => {
  it("allows reopen from closed", () => {
    expect(canTransition("closed", "open")).toBe(true);
    expect(canTransition("closed", "resolved")).toBe(false);
  });
});

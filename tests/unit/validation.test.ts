import { describe, it, expect } from "vitest";
import { z } from "zod";
import { parseInput, parseJsonBody } from "@/lib/validation/http";
import {
  documentVisibilitySchema,
  legacyPaymentStatusSchema,
  spotStatusSchema,
  spotTypeSchema,
  tenantPlanSchema,
  tenantStatusSchema,
  ticketCategorySchema,
  ticketPrioritySchema,
  tokenStatusSchema,
  unitStatusSchema,
  unitTypeSchema,
  visitStatusSchema,
} from "@/lib/validation/enums";
import {
  cuidList,
  dateValue,
  ID_LIST_MAX,
  positiveAmount,
  shortText,
  SHORT_TEXT_MAX,
} from "@/lib/validation/common";

function jsonRequest(body: string): Request {
  return new Request("http://localhost/api/test", {
    method: "POST",
    body,
    headers: { "content-type": "application/json" },
  });
}

describe("parseJsonBody", () => {
  const schema = z.object({ name: shortText });

  it("returns typed data for a valid body", async () => {
    const result = await parseJsonBody(
      jsonRequest(JSON.stringify({ name: "  Torre A  " })),
      schema
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.name).toBe("Torre A");
  });

  it("answers 400 with field details instead of throwing", async () => {
    const result = await parseJsonBody(
      jsonRequest(JSON.stringify({ name: "" })),
      schema
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      const payload = await result.response.json();
      expect(payload.error).toBe("Datos inválidos");
      expect(payload.details.name).toBeDefined();
    }
  });

  it("answers 400 for malformed JSON rather than reaching the catch block", async () => {
    const result = await parseJsonBody(jsonRequest("{not json"), schema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      const payload = await result.response.json();
      expect(payload.error).toBe("JSON inválido");
    }
  });
});

describe("enum whitelists reject arbitrary strings", () => {
  const cases: [string, z.ZodTypeAny, string, string][] = [
    ["token status", tokenStatusSchema, "active", "deleted"],
    ["spot status", spotStatusSchema, "available", "occupied"],
    ["spot type", spotTypeSchema, "resident", "spaceship"],
    ["unit status", unitStatusSchema, "occupied", "sold"],
    ["unit type", unitTypeSchema, "apartment", "castle"],
    ["ticket category", ticketCategorySchema, "plumbing", "haunting"],
    ["ticket priority", ticketPrioritySchema, "urgent", "whenever"],
    ["document visibility", documentVisibilitySchema, "ADMINS", "EVERYONE"],
    ["tenant status", tenantStatusSchema, "ACTIVE", "FREE_FOREVER"],
    ["tenant plan", tenantPlanSchema, "BASIC", "UNLIMITED"],
  ];

  it.each(cases)("%s", (_label, schema, valid, invalidValue) => {
    expect(schema.safeParse(valid).success).toBe(true);
    expect(schema.safeParse(invalidValue).success).toBe(false);
  });
});

describe("visit status uses the persisted vocabulary", () => {
  // check-in/check-out write these; the UI's VISIT_STATUSES list does not
  // contain them, so deriving the whitelist from that list would break them.
  it.each(["scheduled", "checked_in", "checked_out", "cancelled"])(
    "accepts %s",
    (value) => {
      expect(visitStatusSchema.safeParse(value).success).toBe(true);
    }
  );

  it.each(["active", "expired"])("rejects computed-only status %s", (value) => {
    expect(visitStatusSchema.safeParse(value).success).toBe(false);
  });
});

describe("legacy payment status accepts both live casings", () => {
  it.each(["CONFIRMED", "VOID", "completed", "pending", "overdue"])(
    "accepts %s",
    (value) => {
      expect(legacyPaymentStatusSchema.safeParse(value).success).toBe(true);
    }
  );

  it("rejects an unknown status", () => {
    expect(legacyPaymentStatusSchema.safeParse("refunded").success).toBe(false);
  });
});

describe("scalar guards", () => {
  it("rejects NaN and non-positive amounts", () => {
    expect(positiveAmount.safeParse("abc").success).toBe(false);
    expect(positiveAmount.safeParse(0).success).toBe(false);
    expect(positiveAmount.safeParse(-5).success).toBe(false);
    expect(positiveAmount.safeParse("125.50").success).toBe(true);
  });

  it("rejects unparseable dates instead of storing Invalid Date", () => {
    expect(dateValue.safeParse("not-a-date").success).toBe(false);
    const parsed = dateValue.safeParse("2026-03-01");
    expect(parsed.success).toBe(true);
  });

  it("bounds id arrays", () => {
    const withinLimit = Array.from({ length: 10 }, (_, i) => `id-${i}`);
    expect(cuidList.safeParse(withinLimit).success).toBe(true);

    const overLimit = Array.from({ length: ID_LIST_MAX + 1 }, () => "id");
    expect(cuidList.safeParse(overLimit).success).toBe(false);
  });

  it("bounds free text length", () => {
    expect(shortText.safeParse("x".repeat(SHORT_TEXT_MAX)).success).toBe(true);
    expect(shortText.safeParse("x".repeat(SHORT_TEXT_MAX + 1)).success).toBe(
      false
    );
  });
});

describe("parseInput", () => {
  it("validates non-JSON sources such as form fields", () => {
    const ok = parseInput(documentVisibilitySchema, "RESIDENTS");
    expect(ok.ok).toBe(true);

    const bad = parseInput(documentVisibilitySchema, "PUBLIC");
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.response.status).toBe(400);
  });
});

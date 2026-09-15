import { z } from "zod";
import { SPOT_STATUSES, SPOT_TYPES } from "@/lib/parking/constants";
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from "@/lib/tickets/constants";
import {
  STRUCTURE_TYPES,
  TENANT_STATUS,
  UNIT_STATUSES,
  UNIT_TYPES,
} from "@/lib/tenant/constants";
import { PLAN_LIMITS } from "@/lib/tenant/plans";

function enumOf<T extends string>(values: readonly T[]) {
  return z.enum(values as unknown as [T, ...T[]]);
}

function optionValues<T extends string>(options: readonly { value: T }[]) {
  return options.map((option) => option.value);
}

// Derived from the constants the UI renders from, so a new option added there
// is accepted by the API without a second edit here.
export const spotStatusSchema = enumOf(optionValues(SPOT_STATUSES));
export const spotTypeSchema = enumOf(optionValues(SPOT_TYPES));
export const unitStatusSchema = enumOf(optionValues(UNIT_STATUSES));
export const unitTypeSchema = enumOf(optionValues(UNIT_TYPES));
export const structureTypeSchema = enumOf(optionValues(STRUCTURE_TYPES));
export const ticketCategorySchema = enumOf(optionValues(TICKET_CATEGORIES));
export const ticketPrioritySchema = enumOf(optionValues(TICKET_PRIORITIES));
export const tenantStatusSchema = enumOf(TENANT_STATUS);
export const tenantPlanSchema = enumOf(
  Object.keys(PLAN_LIMITS) as (keyof typeof PLAN_LIMITS)[]
);

/**
 * Visit statuses as they are STORED. Deliberately not derived from
 * `VISIT_STATUSES`, which lists the statuses the UI computes for display
 * ("active"/"expired"); check-in and check-out persist "checked_in" and
 * "checked_out", which that list does not contain.
 */
export const visitStatusSchema = z.enum([
  "scheduled",
  "checked_in",
  "checked_out",
  "cancelled",
]);

export const tokenStatusSchema = z.enum(["active", "inactive"]);

export const documentVisibilitySchema = z.enum([
  "ADMINS",
  "RESIDENTS",
  "OWNERS",
  "ALL",
]);

export const announcementStatusSchema = z.enum([
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
]);

export const announcementAudienceSchema = z.enum([
  "ALL",
  "OWNERS",
  "TENANTS",
  "RESIDENTS",
  "UNITS",
]);

export const paymentMethodSchema = z.enum([
  "cash",
  "transfer",
  "card",
  "gateway",
  "other",
]);

/**
 * Legacy payment rows carry lowercase statuses ("completed"/"pending"/
 * "overdue") while the finance module writes "CONFIRMED"/"VOID". Both are live
 * in the database, so both are accepted here.
 */
export const legacyPaymentStatusSchema = z.enum([
  "CONFIRMED",
  "VOID",
  "completed",
  "pending",
  "overdue",
]);

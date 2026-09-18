import { z } from "zod";

/** Upper bound on free-text fields so a request cannot push unbounded blobs. */
export const SHORT_TEXT_MAX = 200;
export const LONG_TEXT_MAX = 5000;

/**
 * Batch endpoints receive one id per unit or charge. No plan caps unit count,
 * so this is sized to be unreachable in normal use while still rejecting a
 * payload crafted to exhaust the connection pool.
 */
export const ID_LIST_MAX = 5000;

export const shortText = z.string().trim().min(1).max(SHORT_TEXT_MAX);
export const optionalShortText = z.string().trim().max(SHORT_TEXT_MAX);
export const optionalLongText = z.string().trim().max(LONG_TEXT_MAX);

export const positiveAmount = z.coerce.number().finite().positive();

/** Rejects unparseable input instead of storing an Invalid Date. */
export const dateValue = z.coerce.date();

export const cuidList = z.array(z.string().min(1)).max(ID_LIST_MAX);

export const intIdFromString = z.coerce.number().int().positive();

/** Treats "" and null the same way the routes already do: as "not set". */
export function nullableText(max = SHORT_TEXT_MAX) {
  return z
    .union([z.string(), z.null()])
    .transform((value) =>
      value == null || value.trim() === "" ? null : value.trim()
    )
    .refine((value) => value == null || value.length <= max, {
      message: `Máximo ${max} caracteres`,
    });
}

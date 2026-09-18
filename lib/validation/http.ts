import { NextResponse } from "next/server";
import { z } from "zod";

export type ParsedInput<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

function invalid(error: z.ZodError): NextResponse {
  return NextResponse.json(
    { error: "Datos inválidos", details: error.flatten().fieldErrors },
    { status: 400 }
  );
}

/** Validates an already-materialized value (form data, query params, params). */
export function parseInput<S extends z.ZodTypeAny>(
  schema: S,
  value: unknown
): ParsedInput<z.infer<S>> {
  const parsed = schema.safeParse(value);
  if (!parsed.success) return { ok: false, response: invalid(parsed.error) };
  return { ok: true, data: parsed.data };
}

/**
 * Reads and validates a JSON request body. A malformed body answers 400 rather
 * than reaching the route's catch block and surfacing as a 500.
 */
export async function parseJsonBody<S extends z.ZodTypeAny>(
  request: Request,
  schema: S
): Promise<ParsedInput<z.infer<S>>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "JSON inválido" }, { status: 400 }),
    };
  }
  return parseInput(schema, raw);
}

import { randomBytes } from "crypto";

/** PIN/token no secuencial para visitas (QR/PIN preparado). */
export function generateAccessCode(bytes = 8): string {
  return randomBytes(bytes).toString("hex").toUpperCase();
}

export function accessCodeExpiresAt(
  from: Date,
  hoursValid = 24
): Date {
  return new Date(from.getTime() + hoursValid * 60 * 60 * 1000);
}

export function isAccessCodeValid(params: {
  code: string | null | undefined;
  expected: string | null | undefined;
  expiresAt: Date | null | undefined;
  now?: Date;
}): boolean {
  if (!params.code || !params.expected) return false;
  if (params.code.trim().toUpperCase() !== params.expected.trim().toUpperCase()) {
    return false;
  }
  const now = params.now ?? new Date();
  if (params.expiresAt && now > params.expiresAt) return false;
  return true;
}

import { cookies } from "next/headers";
import { TENANT_COOKIE, PROPERTY_COOKIE, ORGANIZATION_COOKIE } from "./constants";

export async function getCookieTenantId(): Promise<string | null> {
  const store = cookies();
  return store.get(TENANT_COOKIE)?.value ?? null;
}

export async function getCookiePropertyId(): Promise<string | null> {
  const store = cookies();
  return store.get(PROPERTY_COOKIE)?.value ?? null;
}

export async function getCookieOrganizationId(): Promise<string | null> {
  const store = cookies();
  return store.get(ORGANIZATION_COOKIE)?.value ?? null;
}

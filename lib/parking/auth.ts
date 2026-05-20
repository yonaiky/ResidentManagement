import { NextResponse } from "next/server";
import { isTechnician } from "@/lib/roles";
import { requireTenantAuth, requireTenantManager, hasTenantPermission } from "@/lib/tenant/auth";
import type { AuthTenantUser } from "@/lib/tenant/types";

export type ParkingAuth = AuthTenantUser;

export async function requireParkingAuth(): Promise<
  ParkingAuth | NextResponse
> {
  const auth = await requireTenantAuth("user");
  if (auth instanceof NextResponse) return auth;
  if (isTechnician(auth.ctx.membershipRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return auth;
}

export async function requireParkingManager(): Promise<
  ParkingAuth | NextResponse
> {
  return requireTenantManager();
}

export async function requireParkingAdmin(): Promise<
  ParkingAuth | NextResponse
> {
  const auth = await requireParkingAuth();
  if (auth instanceof NextResponse) return auth;
  if (
    !auth.ctx.isPlatformAdmin &&
    !hasTenantPermission(auth.ctx.membershipRole, "tenant_admin")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return auth;
}

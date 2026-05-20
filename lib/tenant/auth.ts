import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, hasPermission, type AuthUser } from "@/lib/auth";
import { isTechnician } from "@/lib/roles";
import { getCookiePropertyId, getCookieTenantId } from "./context";
import type { AuthTenantUser, TenantContext } from "./types";

const tenantRoleHierarchy: Record<string, number> = {
  tenant_admin: 4,
  manager: 3,
  user: 2,
  technician: 1,
};

export function isPlatformAdmin(profileRole: string): boolean {
  return profileRole === "platform_admin";
}

export function hasTenantPermission(
  membershipRole: string,
  required: "tenant_admin" | "manager" | "user" | "technician"
): boolean {
  const level = tenantRoleHierarchy[membershipRole] ?? 0;
  const requiredLevel = tenantRoleHierarchy[required] ?? 0;
  return level >= requiredLevel;
}

async function resolveMembership(
  profileId: string,
  tenantId: string | null
) {
  if (tenantId) {
    return prisma.tenantMembership.findUnique({
      where: { tenantId_profileId: { tenantId, profileId } },
      include: { tenant: true },
    });
  }
  return prisma.tenantMembership.findFirst({
    where: { profileId, status: "active" },
    include: { tenant: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getTenantContext(
  user: AuthUser,
  preferredTenantId?: string | null
): Promise<TenantContext | null> {
  if (isPlatformAdmin(user.role)) {
    const cookieTenant = preferredTenantId ?? (await getCookieTenantId());
    if (!cookieTenant) return null;
    return {
      tenantId: cookieTenant,
      propertyId: await getCookiePropertyId(),
      membershipRole: "tenant_admin",
      userId: user.userId,
      isPlatformAdmin: true,
    };
  }

  const cookieTenant = preferredTenantId ?? (await getCookieTenantId());
  const membership = await resolveMembership(user.userId, cookieTenant);

  if (!membership || membership.status !== "active") {
    return null;
  }

  if (membership.tenant.status === "SUSPENDED" || membership.tenant.status === "CANCELLED") {
    return null;
  }

  let propertyId = await getCookiePropertyId();
  if (propertyId) {
    const prop = await prisma.property.findFirst({
      where: { id: propertyId, tenantId: membership.tenantId },
    });
    if (!prop) propertyId = null;
  }

  return {
    tenantId: membership.tenantId,
    propertyId,
    membershipRole: membership.role,
    userId: user.userId,
    isPlatformAdmin: false,
  };
}

export async function requirePlatformAdmin(): Promise<
  AuthUser | NextResponse
> {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPlatformAdmin(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return user;
}

export async function requireTenantAuth(
  minRole: "user" | "manager" | "tenant_admin" = "user"
): Promise<AuthTenantUser | NextResponse> {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ctx = await getTenantContext(user);
  if (!ctx) {
    return NextResponse.json(
      { error: "Sin organización activa. Completa el onboarding o selecciona un tenant." },
      { status: 403 }
    );
  }

  if (!ctx.isPlatformAdmin) {
    if (minRole === "tenant_admin" && ctx.membershipRole !== "tenant_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (minRole === "manager" && !hasTenantPermission(ctx.membershipRole, "manager")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (minRole === "user") {
      if (isTechnician(ctx.membershipRole)) {
        // technicians allowed for read paths that pass "user"
      } else if (!hasTenantPermission(ctx.membershipRole, "user")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }

  return {
    userId: user.userId,
    username: user.username,
    email: user.email,
    profileRole: user.role,
    ctx,
  };
}

export async function requireTenantManager(): Promise<
  AuthTenantUser | NextResponse
> {
  return requireTenantAuth("manager");
}

/** Legacy ticket auth bridge: uses tenant membership role when available */
export async function getEffectiveRoleForTickets(
  user: AuthUser,
  ctx: TenantContext
): Promise<string> {
  if (ctx.isPlatformAdmin) return "admin";
  return ctx.membershipRole === "tenant_admin"
    ? "admin"
    : ctx.membershipRole;
}

export function legacyHasPermission(
  effectiveRole: string,
  requiredRole: string
): boolean {
  if (effectiveRole === "tenant_admin") return hasPermission("admin", requiredRole);
  if (effectiveRole === "technician") return isTechnician(effectiveRole);
  return hasPermission(effectiveRole, requiredRole);
}

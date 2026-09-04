import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, hasPermission, type AuthUser } from "@/lib/auth";
import { isTechnician } from "@/lib/roles";
import {
  getCookieOrganizationId,
  getCookiePropertyId,
  getCookieTenantId,
} from "./context";
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

async function resolveMembership(profileId: string, tenantId: string | null) {
  if (tenantId) {
    const byCookie = await prisma.tenantMembership.findUnique({
      where: { tenantId_profileId: { tenantId, profileId } },
      include: { tenant: true },
    });
    if (byCookie && byCookie.status === "active") {
      return byCookie;
    }
  }
  return prisma.tenantMembership.findFirst({
    where: { profileId, status: "active" },
    include: { tenant: true },
    orderBy: { createdAt: "asc" },
  });
}

async function resolveOrganizationContext(
  tenantId: string,
  profileId: string,
  isAdmin: boolean
): Promise<{ organizationId: string | null; organizationRole: string | null }> {
  const cookieOrgId = await getCookieOrganizationId();

  if (cookieOrgId) {
    const org = await prisma.organization.findFirst({
      where: { id: cookieOrgId, tenantId, status: "ACTIVE" },
    });
    if (org) {
      if (isAdmin) {
        return { organizationId: org.id, organizationRole: "tenant_admin" };
      }
      const membership = await prisma.organizationMembership.findUnique({
        where: {
          organizationId_profileId: {
            organizationId: org.id,
            profileId,
          },
        },
      });
      if (membership && membership.status === "active") {
        return {
          organizationId: org.id,
          organizationRole: membership.role,
        };
      }
    }
  }

  const firstOrg = await prisma.organization.findFirst({
    where: { tenantId, status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
  });
  if (!firstOrg) {
    return { organizationId: null, organizationRole: null };
  }

  if (isAdmin) {
    return { organizationId: firstOrg.id, organizationRole: "tenant_admin" };
  }

  const membership = await prisma.organizationMembership.findUnique({
    where: {
      organizationId_profileId: {
        organizationId: firstOrg.id,
        profileId,
      },
    },
  });

  if (membership && membership.status === "active") {
    return {
      organizationId: firstOrg.id,
      organizationRole: membership.role,
    };
  }

  return { organizationId: null, organizationRole: null };
}

export async function getTenantContext(
  user: AuthUser,
  preferredTenantId?: string | null
): Promise<TenantContext | null> {
  if (isPlatformAdmin(user.role)) {
    let cookieTenant = preferredTenantId ?? (await getCookieTenantId());
    if (!cookieTenant) {
      const first = await prisma.tenant.findFirst({
        where: { status: { in: ["TRIAL", "ACTIVE"] } },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      cookieTenant = first?.id ?? null;
    }
    if (!cookieTenant) return null;

    const orgCtx = await resolveOrganizationContext(
      cookieTenant,
      user.userId,
      true
    );

    let propertyId = await getCookiePropertyId();
    if (propertyId) {
      const prop = await prisma.property.findFirst({
        where: { id: propertyId, tenantId: cookieTenant },
      });
      if (!prop) propertyId = null;
    }

    return {
      tenantId: cookieTenant,
      organizationId: orgCtx.organizationId,
      propertyId,
      membershipRole: "tenant_admin",
      organizationRole: orgCtx.organizationRole,
      userId: user.userId,
      isPlatformAdmin: true,
    };
  }

  const cookieTenant = preferredTenantId ?? (await getCookieTenantId());
  const membership = await resolveMembership(user.userId, cookieTenant);

  if (!membership || membership.status !== "active") {
    return null;
  }

  if (
    membership.tenant.status === "SUSPENDED" ||
    membership.tenant.status === "CANCELLED"
  ) {
    return null;
  }

  const orgCtx = await resolveOrganizationContext(
    membership.tenantId,
    user.userId,
    false
  );

  let propertyId = await getCookiePropertyId();
  if (propertyId) {
    const prop = await prisma.property.findFirst({
      where: { id: propertyId, tenantId: membership.tenantId },
    });
    if (!prop) propertyId = null;
  }

  const effectiveRole = orgCtx.organizationRole ?? membership.role;

  return {
    tenantId: membership.tenantId,
    organizationId: orgCtx.organizationId,
    propertyId,
    membershipRole: membership.role,
    organizationRole: orgCtx.organizationRole,
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
      {
        error:
          "Sin organización activa. Completa el onboarding o selecciona un tenant.",
      },
      { status: 403 }
    );
  }

  const roleForCheck = ctx.organizationRole ?? ctx.membershipRole;

  if (!ctx.isPlatformAdmin) {
    if (minRole === "tenant_admin" && roleForCheck !== "tenant_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (minRole === "manager" && !hasTenantPermission(roleForCheck, "manager")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (minRole === "user") {
      if (isTechnician(roleForCheck)) {
        // technicians allowed for read paths
      } else if (!hasTenantPermission(roleForCheck, "user")) {
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

export async function getEffectiveRoleForTickets(
  user: AuthUser,
  ctx: TenantContext
): Promise<string> {
  if (ctx.isPlatformAdmin) return "admin";
  const role = ctx.organizationRole ?? ctx.membershipRole;
  return role === "tenant_admin" ? "admin" : role;
}

export function legacyHasPermission(
  effectiveRole: string,
  requiredRole: string
): boolean {
  if (effectiveRole === "tenant_admin")
    return hasPermission("admin", requiredRole);
  if (effectiveRole === "technician") return isTechnician(effectiveRole);
  return hasPermission(effectiveRole, requiredRole);
}

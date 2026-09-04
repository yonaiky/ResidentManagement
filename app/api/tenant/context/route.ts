import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import {
  TENANT_COOKIE,
  PROPERTY_COOKIE,
  ORGANIZATION_COOKIE,
} from "@/lib/tenant/constants";
import { isPlatformAdmin } from "@/lib/tenant/auth";
import {
  getCookieOrganizationId,
  getCookiePropertyId,
  getCookieTenantId,
} from "@/lib/tenant/context";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [currentTenantId, currentOrganizationId, currentPropertyId] =
    await Promise.all([
      getCookieTenantId(),
      getCookieOrganizationId(),
      getCookiePropertyId(),
    ]);

  if (isPlatformAdmin(user.role)) {
    const tenants = await prisma.tenant.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, plan: true, status: true },
    });

    const organizations = currentTenantId
      ? await prisma.organization.findMany({
          where: { tenantId: currentTenantId, status: "ACTIVE" },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            slug: true,
            organizationType: true,
            status: true,
          },
        })
      : [];

    return NextResponse.json({
      isPlatformAdmin: true,
      tenants,
      organizations,
      memberships: [],
      currentTenantId,
      currentOrganizationId,
      currentPropertyId,
    });
  }

  const memberships = await prisma.tenantMembership.findMany({
    where: { profileId: user.userId, status: "active" },
    include: {
      tenant: {
        select: { id: true, name: true, slug: true, plan: true, status: true },
      },
    },
  });

  const tenantIds = memberships.map((m) => m.tenantId);
  const orgMemberships = await prisma.organizationMembership.findMany({
    where: {
      profileId: user.userId,
      status: "active",
      organization: { tenantId: { in: tenantIds }, status: "ACTIVE" },
    },
    include: {
      organization: {
        select: {
          id: true,
          tenantId: true,
          name: true,
          slug: true,
          organizationType: true,
          status: true,
        },
      },
    },
  });

  return NextResponse.json({
    isPlatformAdmin: false,
    tenants: memberships.map((m) => m.tenant),
    organizations: orgMemberships.map((m) => m.organization),
    memberships: memberships.map((m) => ({
      tenantId: m.tenantId,
      role: m.role,
    })),
    organizationMemberships: orgMemberships.map((m) => ({
      organizationId: m.organizationId,
      tenantId: m.organization.tenantId,
      role: m.role,
    })),
    currentTenantId,
    currentOrganizationId,
    currentPropertyId,
  });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const tenantId = body.tenantId as string | undefined;
  const organizationId = body.organizationId as string | undefined;
  const propertyId = body.propertyId as string | null | undefined;

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  }

  if (!isPlatformAdmin(user.role)) {
    const membership = await prisma.tenantMembership.findUnique({
      where: {
        tenantId_profileId: { tenantId, profileId: user.userId },
      },
    });
    if (!membership || membership.status !== "active") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  let resolvedOrgId = organizationId ?? null;
  if (resolvedOrgId) {
    const org = await prisma.organization.findFirst({
      where: { id: resolvedOrgId, tenantId, status: "ACTIVE" },
    });
    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }
    if (!isPlatformAdmin(user.role)) {
      const orgMembership = await prisma.organizationMembership.findUnique({
        where: {
          organizationId_profileId: {
            organizationId: resolvedOrgId,
            profileId: user.userId,
          },
        },
      });
      if (!orgMembership || orgMembership.status !== "active") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  } else {
    const defaultOrg = await prisma.organization.findFirst({
      where: { tenantId, status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
    });
    resolvedOrgId = defaultOrg?.id ?? null;
  }

  if (propertyId) {
    const prop = await prisma.property.findFirst({
      where: { id: propertyId, tenantId },
    });
    if (!prop) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
  }

  const res = NextResponse.json({
    ok: true,
    tenantId,
    organizationId: resolvedOrgId,
  });
  const cookieOpts = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === "production",
  };
  res.cookies.set(TENANT_COOKIE, tenantId, cookieOpts);
  if (resolvedOrgId) {
    res.cookies.set(ORGANIZATION_COOKIE, resolvedOrgId, cookieOpts);
  } else {
    res.cookies.set(ORGANIZATION_COOKIE, "", {
      path: "/",
      maxAge: 0,
      secure: process.env.NODE_ENV === "production",
    });
  }
  if (propertyId) {
    res.cookies.set(PROPERTY_COOKIE, propertyId, cookieOpts);
  } else {
    res.cookies.set(PROPERTY_COOKIE, "", {
      path: "/",
      maxAge: 0,
      secure: process.env.NODE_ENV === "production",
    });
  }
  return res;
}

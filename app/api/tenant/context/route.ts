import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { TENANT_COOKIE, PROPERTY_COOKIE } from "@/lib/tenant/constants";
import { isPlatformAdmin } from "@/lib/tenant/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isPlatformAdmin(user.role)) {
    const tenants = await prisma.tenant.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, plan: true, status: true },
    });
    return NextResponse.json({
      isPlatformAdmin: true,
      tenants,
      memberships: [],
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

  return NextResponse.json({
    isPlatformAdmin: false,
    tenants: memberships.map((m) => m.tenant),
    memberships: memberships.map((m) => ({
      tenantId: m.tenantId,
      role: m.role,
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const tenantId = body.tenantId as string | undefined;
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

  if (propertyId) {
    const prop = await prisma.property.findFirst({
      where: { id: propertyId, tenantId },
    });
    if (!prop) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(TENANT_COOKIE, tenantId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  if (propertyId) {
    res.cookies.set(PROPERTY_COOKIE, propertyId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  } else {
    res.cookies.set(PROPERTY_COOKIE, "", { path: "/", maxAge: 0 });
  }
  return res;
}

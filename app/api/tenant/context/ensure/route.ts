import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/tenant/auth";
import { TENANT_COOKIE, PROPERTY_COOKIE } from "@/lib/tenant/constants";
import { getCookieTenantId } from "@/lib/tenant/context";

/**
 * Ensures rm-tenant-id cookie is set to a valid tenant for the current user.
 * Fixes 403s on dashboard/properties when cookie is missing or stale.
 */
export async function POST() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentCookie = await getCookieTenantId();

  if (isPlatformAdmin(user.role)) {
    let tenantId = currentCookie;
    if (tenantId) {
      const exists = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true },
      });
      if (!exists) tenantId = null;
    }
    if (!tenantId) {
      const first = await prisma.tenant.findFirst({
        where: { status: { in: ["TRIAL", "ACTIVE"] } },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      tenantId = first?.id ?? null;
    }
    if (!tenantId) {
      return NextResponse.json(
        { error: "No hay organizaciones en la plataforma" },
        { status: 403 }
      );
    }
    const res = NextResponse.json({ ok: true, tenantId });
    res.cookies.set(TENANT_COOKIE, tenantId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  }

  let membership =
    currentCookie
      ? await prisma.tenantMembership.findUnique({
          where: {
            tenantId_profileId: {
              tenantId: currentCookie,
              profileId: user.userId,
            },
          },
          include: { tenant: true },
        })
      : null;

  if (
    !membership ||
    membership.status !== "active" ||
    membership.tenant.status === "SUSPENDED" ||
    membership.tenant.status === "CANCELLED"
  ) {
    membership = await prisma.tenantMembership.findFirst({
      where: {
        profileId: user.userId,
        status: "active",
        tenant: { status: { in: ["TRIAL", "ACTIVE"] } },
      },
      include: { tenant: true },
      orderBy: { createdAt: "asc" },
    });
  }

  if (!membership) {
    return NextResponse.json(
      { error: "Sin organización. Completa el onboarding." },
      { status: 403 }
    );
  }

  const res = NextResponse.json({
    ok: true,
    tenantId: membership.tenantId,
  });
  res.cookies.set(TENANT_COOKIE, membership.tenantId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === "production",
  });

  if (currentCookie && currentCookie !== membership.tenantId) {
    res.cookies.set(PROPERTY_COOKIE, "", {
      path: "/",
      maxAge: 0,
      secure: process.env.NODE_ENV === "production",
    });
  }

  return res;
}

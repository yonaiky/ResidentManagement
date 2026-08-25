import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/tenant/auth";
import { createTenantWithOwner } from "@/lib/tenant/create-tenant";
import { TENANT_COOKIE, PROPERTY_COOKIE } from "@/lib/tenant/constants";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isPlatformAdmin(user.role)) {
    return NextResponse.json({ needsOnboarding: false });
  }

  const membership = await prisma.tenantMembership.findFirst({
    where: { profileId: user.userId, status: "active" },
  });

  return NextResponse.json({ needsOnboarding: !membership });
}

/** First organization only — additional orgs use POST /api/owner/tenants */
export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isPlatformAdmin(user.role)) {
    return NextResponse.json(
      { error: "Platform admin skips onboarding" },
      { status: 400 }
    );
  }

  const existing = await prisma.tenantMembership.findFirst({
    where: { profileId: user.userId },
  });
  if (existing) {
    return NextResponse.json(
      {
        error:
          "Ya tienes una organización. Crea otra desde Mis organizaciones.",
      },
      { status: 409 }
    );
  }

  try {
    const body = await request.json();
    const result = await createTenantWithOwner({
      organizationName: body.organizationName,
      profileId: user.userId,
      email: user.email,
      propertyName: body.propertyName,
      propertyCode: body.propertyCode,
      propertyType: body.propertyType,
      address: body.address,
    });

    const res = NextResponse.json({
      tenantId: result.tenant.id,
      propertyId: result.property?.id ?? null,
    });
    res.cookies.set(TENANT_COOKIE, result.tenant.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    if (result.property) {
      res.cookies.set(PROPERTY_COOKIE, result.property.id, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
    return res;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/tenant/auth";
import {
  applyPlanLimitsToTenant,
  slugifyTenantName,
} from "@/lib/tenant/plans";
import { TENANT_COOKIE, PROPERTY_COOKIE } from "@/lib/tenant/constants";
import { assertWithinLimit } from "@/lib/tenant/limits";

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

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isPlatformAdmin(user.role)) {
    return NextResponse.json({ error: "Platform admin skips onboarding" }, { status: 400 });
  }

  const existing = await prisma.tenantMembership.findFirst({
    where: { profileId: user.userId },
  });
  if (existing) {
    return NextResponse.json({ error: "Ya tienes una organización" }, { status: 409 });
  }

  try {
    const body = await request.json();
    const organizationName = body.organizationName?.trim();
    const propertyName = body.propertyName?.trim();
    const propertyCode = body.propertyCode?.trim();

    if (!organizationName) {
      return NextResponse.json({ error: "organizationName required" }, { status: 400 });
    }

    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + 14);

    let slug = slugifyTenantName(organizationName);
    if (await prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: organizationName,
          slug,
          status: "TRIAL",
          trialEndsAt: trialEnds,
          email: user.email,
          ...applyPlanLimitsToTenant("BASIC"),
        },
      });

      await tx.tenantMembership.create({
        data: {
          tenantId: tenant.id,
          profileId: user.userId,
          role: "tenant_admin",
          status: "active",
        },
      });

      let property = null;
      if (propertyName && propertyCode) {
        const limitCheck = await assertWithinLimit(tenant, "properties");
        if (!limitCheck.ok) {
          throw new Error(limitCheck.message);
        }
        property = await tx.property.create({
          data: {
            tenantId: tenant.id,
            name: propertyName,
            code: propertyCode.toUpperCase(),
            propertyType: body.propertyType ?? "condominium",
            address: body.address?.trim() || null,
          },
        });
      }

      return { tenant, property };
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

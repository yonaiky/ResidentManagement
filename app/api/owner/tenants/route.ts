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
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        status: true,
        trialEndsAt: true,
        createdAt: true,
        _count: {
          select: { properties: true, memberships: true },
        },
      },
    });

    return NextResponse.json({
      items: tenants.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        plan: t.plan,
        status: t.status,
        trialEndsAt: t.trialEndsAt?.toISOString() ?? null,
        createdAt: t.createdAt.toISOString(),
        propertyCount: t._count.properties,
        memberCount: t._count.memberships,
        membershipRole: "tenant_admin" as const,
      })),
    });
  }

  const memberships = await prisma.tenantMembership.findMany({
    where: {
      profileId: user.userId,
      status: "active",
      role: "tenant_admin",
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          status: true,
          trialEndsAt: true,
          createdAt: true,
          _count: {
            select: { properties: true, memberships: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    items: memberships.map((m) => ({
      id: m.tenant.id,
      name: m.tenant.name,
      slug: m.tenant.slug,
      plan: m.tenant.plan,
      status: m.tenant.status,
      trialEndsAt: m.tenant.trialEndsAt?.toISOString() ?? null,
      createdAt: m.tenant.createdAt.toISOString(),
      propertyCount: m.tenant._count.properties,
      memberCount: m.tenant._count.memberships,
      membershipRole: m.role,
    })),
  });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isPlatformAdmin(user.role)) {
    return NextResponse.json(
      { error: "Usa el panel de plataforma para crear tenants" },
      { status: 400 }
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

    const res = NextResponse.json(
      {
        tenantId: result.tenant.id,
        propertyId: result.property?.id ?? null,
        tenant: {
          id: result.tenant.id,
          name: result.tenant.name,
          slug: result.tenant.slug,
        },
      },
      { status: 201 }
    );

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
    } else {
      res.cookies.set(PROPERTY_COOKIE, "", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
    }
    return res;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

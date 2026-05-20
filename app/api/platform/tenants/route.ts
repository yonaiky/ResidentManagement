import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/tenant/auth";
import {
  applyPlanLimitsToTenant,
  slugifyTenantName,
  getPlanLabel,
} from "@/lib/tenant/plans";

export async function GET() {
  const auth = await requirePlatformAdmin();
  if (auth instanceof NextResponse) return auth;

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          memberships: true,
          properties: true,
          residents: true,
        },
      },
    },
  });

  return NextResponse.json({
    items: tenants.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      plan: t.plan,
      planLabel: getPlanLabel(t.plan),
      status: t.status,
      trialEndsAt: t.trialEndsAt?.toISOString() ?? null,
      counts: t._count,
      createdAt: t.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { name, slug: rawSlug, plan = "BASIC", adminEmail } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    let slug = rawSlug?.trim() || slugifyTenantName(name);
    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;

    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + 14);

    const tenant = await prisma.tenant.create({
      data: {
        name: name.trim(),
        slug,
        status: "TRIAL",
        trialEndsAt: trialEnds,
        ...applyPlanLimitsToTenant(plan),
      },
    });

    if (adminEmail) {
      const profile = await prisma.profile.findUnique({
        where: { email: String(adminEmail).trim() },
      });
      if (profile) {
        await prisma.tenantMembership.create({
          data: {
            tenantId: tenant.id,
            profileId: profile.id,
            role: "tenant_admin",
            status: "active",
          },
        });
      }
    }

    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    console.error("POST /api/platform/tenants", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
